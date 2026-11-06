/* Shared behavior for the multi-page PEAK site.
   Contact posts to /api/contact with reCAPTCHA and the website honeypot. */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var legacy = {
    home: '/',
    about: '/about/',
    program: '/program/',
    evidence: '/evidence/',
    blog: '/blog/',
    'helpful-links': '/resources/',
    'payment-options': '/pricing/',
    consultation: '/consultation/',
    contact: '/contact/',
    ebook: '/ebook/',
    'patient-stories': '/patient-stories/',
    faq: '/faq/',
    'l-craig': '/patient-stories/#l-craig',
    yvonne: '/patient-stories/#yvonne',
    anonymous: '/patient-stories/#anonymous',
    barbara: '/patient-stories/#barbara',
    'about-story-video': '/about/#about-story-video',
    'ebook-signup': '/ebook/#ebook-signup'
  };
  var hash = (location.hash || '').replace(/^#/, '');
  var path = location.pathname;
  if (hash && legacy[hash] && (path === '/' || path === '/index.html')) {
    location.replace(legacy[hash]);
    return;
  }

  var frame = document.getElementById('inline-JvGwX8MG7DenmjwVKses');
  if (frame && !frame.getAttribute('src')) {
    frame.src = 'https://link.peakcognitivelongevity.com/widget/form/JvGwX8MG7DenmjwVKses';
  }

  var search = document.getElementById('blog-search');
  if (search) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.post-list li'));
    var empty = document.getElementById('blog-empty');
    var filter = function () {
      var query = search.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (item) {
        var hay = (item.getAttribute('data-search') || '').toLowerCase();
        var match = !query || hay.indexOf(query) !== -1;
        item.hidden = !match;
        if (match) shown += 1;
      });
      document.querySelectorAll('.blog-group').forEach(function (group) {
        var visible = group.querySelectorAll('.post-list li:not([hidden])').length;
        group.hidden = visible === 0;
      });
      if (empty) empty.hidden = shown !== 0;
    };
    search.addEventListener('input', filter);
  }

  var contactCaptchaId = null;
  var contactCaptchaLoading = false;
  var form = document.getElementById('contact-form');
  if (!form) return;

  function initializeContactCaptcha() {
    if (contactCaptchaId !== null || contactCaptchaLoading) return;
    contactCaptchaLoading = true;
    var status = document.getElementById('captcha-status');
    status.textContent = 'Loading verification...';
    fetch('/api/contact-config')
      .then(function (configResponse) { return configResponse.json().then(function (config) { return { ok: configResponse.ok, config: config }; }); })
      .then(function (result) {
        if (!result.ok || !result.config.siteKey) throw new Error('Verification configuration unavailable');
        var ready = window.grecaptcha && window.grecaptcha.render
          ? Promise.resolve()
          : new Promise(function (resolve, reject) {
              var script = document.createElement('script');
              var timeout = setTimeout(function () {
                script.remove();
                reject(new Error('reCAPTCHA load timed out'));
              }, 12000);
              window.peakRecaptchaLoaded = function () { clearTimeout(timeout); resolve(); };
              script.src = 'https://www.google.com/recaptcha/api.js?onload=peakRecaptchaLoaded&render=explicit';
              script.async = true;
              script.onerror = function () { clearTimeout(timeout); script.remove(); reject(new Error('Unable to load reCAPTCHA')); };
              document.head.appendChild(script);
            });
        return ready.then(function () { return result.config.siteKey; });
      })
      .then(function (siteKey) {
        contactCaptchaId = window.grecaptcha.render('contact-captcha', {
          sitekey: siteKey,
          size: 'compact',
          callback: function () { status.textContent = 'Verification complete.'; },
          'expired-callback': function () { status.textContent = 'Verification expired. Please complete reCAPTCHA again.'; },
          'error-callback': function () { status.textContent = 'Verification could not load. Please check your connection or contact the team directly.'; }
        });
        status.textContent = 'Please complete the reCAPTCHA before sending.';
      })
      .catch(function () {
        status.textContent = 'Verification is unavailable. Please email team@peakcognitivelongevity.com or call (817) 796-5115.';
      })
      .finally(function () { contactCaptchaLoading = false; });
  }

  async function handleContactSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var button = form.querySelector('button[type="submit"]');
    if (button.disabled || !form.reportValidity()) return;
    var status = form.querySelector('#contact-status');
    var captchaToken = contactCaptchaId !== null && window.grecaptcha ? window.grecaptcha.getResponse(contactCaptchaId) : '';
    if (!captchaToken) {
      status.hidden = false;
      status.textContent = 'Please complete the reCAPTCHA before sending. If verification is unavailable, please call or email the PEAK team.';
      return;
    }
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    button.disabled = true;
    button.textContent = 'Sending...';
    status.hidden = false;
    status.textContent = 'Submitting your message...';
    form.setAttribute('aria-busy', 'true');
    try {
      var response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          name: form.querySelector('#c-name').value.trim(),
          phone: form.querySelector('#c-phone').value.trim(),
          email: form.querySelector('#c-email').value.trim(),
          message: form.querySelector('#c-msg').value.trim(),
          website: form.querySelector('#c-website').value,
          captchaToken: captchaToken
        })
      });
      var result = await response.json();
      if (!response.ok || result.success !== true) {
        throw new Error(result.error || 'Your message could not be submitted.');
      }
      form.reset();
      status.textContent = 'Your message has been submitted to the PEAK team. We typically respond within one business day.';
      if (window.peakTrack) window.peakTrack('generate_lead', { method: 'contact_form' });
    } catch (error) {
      status.textContent = 'We could not confirm your message was submitted. Please complete reCAPTCHA again before retrying. ' +
        (error.name === 'AbortError' ? 'The request timed out. ' : '') +
        'Your information is still here. Please try again, or email team@peakcognitivelongevity.com or call (817) 796-5115.';
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.textContent = 'Send Message';
      form.removeAttribute('aria-busy');
      if (window.grecaptcha && contactCaptchaId !== null) window.grecaptcha.reset(contactCaptchaId);
    }
  }

  form.addEventListener('submit', handleContactSubmit);
  initializeContactCaptcha();
})();

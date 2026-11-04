/* PEAK site analytics (Google Analytics 4).
   Configured for the PEAK web data stream. Using 'G-XXXXXXXXXX' below
   disables analytics without changing site navigation.
   In Enhanced measurement, disable browser-history page views (navigation
   is tracked here manually) and Form interactions. Do not send contact
   form fields, patient information, or booking details to Analytics.
   Review privacy disclosures and applicable consent requirements before enabling.
   Reports live in Google Analytics; invite coworkers as property Viewers.
   E-book signup clicks and booking clicks do not confirm completed downloads
   or appointments on the external services. */
(function () {
  var GA_MEASUREMENT_ID = 'G-ZC8M6XCGNV';

  /* Safe no-op so pages can call peakTrack() even before GA is configured. */
  window.peakTrack = function () {};

  if (GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return; /* not configured yet */

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: location.origin + location.pathname
  });

  var loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(loader);

  window.peakTrack = function (name, params) {
    window.gtag('event', name, params || {});
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('page-home')) {
      window.peakTrack('page_view', {
        page_title: document.title,
        page_location: location.origin + location.pathname
      });
    }
  });

  /* Track clicks on key links anywhere on the site:
     Practice Better booking, client portal, phone, and email links. */
  document.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== document && !(el.tagName === 'A' && el.href)) el = el.parentNode;
    if (!el || el === document || !el.href) return;
    var href = el.href;
    if (href.indexOf('practicebetter.io') !== -1) {
      window.peakTrack(
        href.indexOf('/bookings') !== -1 ? 'book_consultation_click' : 'client_portal_click',
        { link_url: href }
      );
    } else if (href.indexOf('tel:') === 0) {
      window.peakTrack('phone_click', { link_url: href });
    } else if (href.indexOf('mailto:') === 0) {
      window.peakTrack('email_click', { link_url: href });
    }
  }, true);
})();

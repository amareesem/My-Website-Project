const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets', 'analytics.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function setup(configured, spa) {
  const listeners = {};
  const scripts = [];
  const target = { classList: { add() {} } };
  const context = {
    location: { origin: 'https://example.com', pathname: '/', href: 'https://example.com/?private=value' },
    document: {
      title: 'PEAK',
      head: { appendChild(script) { scripts.push(script); } },
      createElement() { return {}; },
      addEventListener(name, callback) { listeners[name] = callback; },
      getElementById(id) { return spa && id.startsWith('page-') ? target : null; },
      querySelectorAll() { return []; }
    },
    history: { replaceState() {} },
    PAGE_TITLES: { home: 'Home', consultation: 'Consultation' }
  };
  context.window = context;
  context.scrollTo = function () {};
  vm.createContext(context);
  vm.runInContext(configured ? source : source.replace(
    /var GA_MEASUREMENT_ID = 'G-[A-Z0-9]+';/,
    "var GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';"
  ), context);
  return { context, listeners, scripts };
}

function events(context) {
  return context.dataLayer.filter(entry => entry[0] === 'event');
}

test('placeholder does not load Google or register tracking listeners', () => {
  const { context, listeners, scripts } = setup(false, true);
  context.peakTrack('generate_lead');
  assert.equal(scripts.length, 0);
  assert.equal(Object.keys(listeners).length, 0);
  assert.equal(context.dataLayer, undefined);
});

test('static page sends one explicit page view without query parameters', () => {
  const { context, listeners, scripts } = setup(true, false);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-ZC8M6XCGNV');
  assert.equal(context.dataLayer.find(entry => entry[0] === 'config')[1], 'G-ZC8M6XCGNV');
  const config = context.dataLayer.find(entry => entry[0] === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  listeners.DOMContentLoaded();
  assert.equal(events(context).length, 1);
  assert.equal(events(context)[0][2].page_location, 'https://example.com/');
});

test('SPA tracks initial and changed pages, not repeated navigation', () => {
  const { context, listeners } = setup(true, true);
  const navigation = html.match(/  function goTo\(name\)\{[\s\S]*?(?=  function scrollToId)/);
  assert.ok(navigation);
  vm.runInContext(navigation[0], context);
  context.goTo('home');
  listeners.DOMContentLoaded();
  context.goTo('consultation');
  context.goTo('consultation');
  assert.equal(events(context).length, 2);
  assert.equal(events(context)[0][2].page_location, 'https://example.com/#home');
  assert.equal(events(context)[1][2].page_location, 'https://example.com/#consultation');
});

test('booking, portal, phone and email clicks have distinct events', () => {
  const { context, listeners } = setup(true, false);
  for (const href of [
    'https://example.practicebetter.io/#/bookings?r=123',
    'https://example.practicebetter.io/#/signin',
    'tel:+15555555555',
    'mailto:team@example.com'
  ]) {
    listeners.click({ target: { tagName: 'A', href } });
  }
  assert.deepEqual(Array.from(events(context), entry => entry[1]), [
    'book_consultation_click', 'client_portal_click', 'phone_click', 'email_click'
  ]);
});

test('each public page and both generators include analytics once', () => {
  const pages = ['index.html', path.join('faq', 'index.html'), path.join('evidence', 'index.html')];
  for (const folder of fs.readdirSync(path.join(root, 'blog'))) {
    const file = path.join('blog', folder, 'index.html');
    if (fs.existsSync(path.join(root, file))) pages.push(file);
  }
  for (const file of [...pages, path.join('scripts', 'build-food-fight.js'), path.join('scripts', 'build-longevity-pearls.js'), path.join('scripts', 'build-brain-health.js')]) {
    assert.equal((fs.readFileSync(path.join(root, file), 'utf8').match(/\/assets\/analytics\.js/g) || []).length, 1, file);
  }
});

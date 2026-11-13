import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('canvas stops in background and reduced motion, resumes with one loop', () => {
  const documentEvents = {}, windowEvents = {}, jobs = new Map();
  let next = 0, draws = 0;
  const preference = { matches: false, addEventListener: (name, fn) => { preference.change = fn; } };
  const document = { documentElement: { dataset: {} }, hidden: false, querySelectorAll: () => [], addEventListener: (name, fn) => { (documentEvents[name] ??= []).push(fn); }, dispatchEvent: event => documentEvents[event.type]?.forEach(fn => fn()) };
  const window = { addEventListener: (name, fn) => { (windowEvents[name] ??= []).push(fn); } };
  vm.runInNewContext(read('assets/app.js'), { document, window, navigator: {}, matchMedia: () => preference, sessionStorage: { getItem() { throw Error('blocked'); } }, Event, devicePixelRatio: 3, requestAnimationFrame: fn => { jobs.set(++next, fn); return next; }, cancelAnimationFrame: id => jobs.delete(id) });
  const canvas = { getContext: () => ({ setTransform() {} }), getBoundingClientRect: () => ({ width: 320, height: 600 }) };
  window.Welten.createScene(canvas, () => draws++);
  assert.equal(canvas.width, 640, 'pixel density capped at 2');
  assert.equal(jobs.size, 1);
  document.hidden = true; document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(jobs.size, 0);
  document.hidden = false; preference.matches = true; preference.change();
  assert.equal(jobs.size, 0); assert.ok(draws >= 2);
  preference.matches = false; preference.change();
  assert.equal(jobs.size, 1);
  document.dispatchEvent(new Event('welten:motionchange'));
  assert.equal(jobs.size, 1, 'repeated changes do not multiply loops');
  assert.doesNotThrow(() => window.Welten.createScene({ getContext: () => null }, () => {}));
});

function workerHarness() {
  const events = {}, files = new Map(), deleted = [], navigated = [];
  let skipped = false;
  const cache = { addAll: async urls => { for (const url of urls) files.set(url, new Response(url)); }, match: async request => files.get(typeof request === 'string' ? request : request.url), put: async (request, response) => files.set(typeof request === 'string' ? request : request.url, response) };
  const context = { self: { registration: { scope: 'https://example.com/gift/' }, location: new URL('https://example.com/gift/sw.js'), clients: { claim: async () => {}, matchAll: async () => [
    { url: 'https://example.com/gift/index.html', navigate: async url => navigated.push(url) },
    { url: 'https://example.com/other/index.html', navigate: async url => navigated.push(url) }
  ] }, skipWaiting: async () => { skipped = true; }, addEventListener: (name, fn) => { events[name] = fn; } }, caches: { open: async () => cache, keys: async () => ['welten-/gift/-old', 'welten-/other/-old', 'another-app-cache'], delete: async name => { deleted.push(name); } }, fetch: async () => { throw Error('offline'); }, URL, Response };
  vm.runInNewContext(read('sw.js'), context);
  return { events, files, deleted, navigated, didSkip: () => skipped };
}

test('offline installation includes every world and stays within its subdirectory', async () => {
  const { events, files } = workerHarness();
  let work; events.install({ waitUntil: promise => { work = promise; } }); await work;
  for (const page of ['index.html', 'under_quiet_stars/index.html', 'under_quiet_stars/cats.html', 'nights_embrace/index.html', 'northern_lights/index.html']) assert.ok(files.has('https://example.com/gift/' + page), page);
  assert.ok(files.has('https://example.com/gift/assets/update.js'));
  assert.ok([...files.keys()].every(url => !url.includes('birthday')));
  for (const url of files.keys()) assert.ok(url.startsWith('https://example.com/gift/'));
});

test('a completed update replaces old pages in this app only', async () => {
  const { events, navigated, didSkip } = workerHarness();
  let work;
  events.install({ waitUntil: promise => { work = promise; } }); await work;
  assert.equal(didSkip(), true);
  events.activate({ waitUntil: promise => { work = promise; } }); await work;
  assert.deepEqual(navigated, ['https://example.com/gift/index.html']);
});

test('offline navigation serves the exact world, unknown routes remain errors', async () => {
  const { events, files } = workerHarness();
  files.set('https://example.com/gift/northern_lights/index.html', new Response('Nordlicht'));
  let response;
  events.fetch({ request: { method: 'GET', url: 'https://example.com/gift/northern_lights/', mode: 'navigate' }, respondWith: promise => { response = promise; }, waitUntil() {} });
  assert.equal(await (await response).text(), 'Nordlicht');
  events.fetch({ request: { method: 'GET', url: 'https://example.com/gift/unknown.html', mode: 'navigate' }, respondWith: promise => { response = promise; }, waitUntil() {} });
  assert.equal((await response).status, 503);
  assert.equal((await response).headers.get('content-type'), 'text/plain; charset=utf-8');
});

test('worker leaves unrelated caches and external requests alone', async () => {
  const { events, deleted } = workerHarness();
  let work; events.activate({ waitUntil: promise => { work = promise; } }); await work;
  assert.deepEqual(deleted, ['welten-/gift/-old']);
  let intercepted = false;
  events.fetch({ request: { method: 'GET', url: 'https://other.com/a.png' }, respondWith() { intercepted = true; } });
  assert.equal(intercepted, false);
});

test('online content remains available when cache storage fails', async () => {
  for (const failure of ['open', 'put']) {
    const events = {};
    vm.runInNewContext(read('sw.js'), {
      self: { registration: { scope: 'https://example.com/gift/' }, addEventListener: (name, fn) => { events[name] = fn; } },
      caches: { open: async () => {
        if (failure === 'open') throw Error('storage unavailable');
        return { match: async () => undefined, put: async () => { throw Error('quota exceeded'); } };
      } },
      fetch: async () => new Response('Online content'), URL, Response
    });
    let response;
    const background = [];
    events.fetch({ request: { method: 'GET', url: 'https://example.com/gift/index.html', mode: 'navigate' }, respondWith: promise => { response = promise; }, waitUntil: promise => background.push(promise) });
    assert.equal(await (await response).text(), 'Online content', failure);
    await Promise.all(background);
  }
});

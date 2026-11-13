import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const cookieName = 'welten_update_seen';

function openPage({ cookies = '', secure = true, denied = false, showFails = false } = {}) {
  const events = {}, classes = new Set(), writes = [];
  const closeButton = { addEventListener: (name, fn) => { closeButton.click = fn; } };
  const link = {};
  const dialog = {
    open: false, shown: 0, removed: false, setAttribute() {},
    showModal() { if (showFails) throw Error('cannot display'); this.open = true; this.shown++; },
    close() { this.open = false; events.close?.(); },
    remove() { this.removed = true; },
    addEventListener: (name, fn) => { events[name] = fn; },
    querySelector: selector => selector === '[data-update-close]' ? closeButton : link
  };
  const document = {
    currentScript: { src: `${secure ? 'https' : 'http'}://example.com/gift/assets/update.js` },
    createElement: () => dialog,
    documentElement: { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } },
    body: { appendChild() {} }
  };
  Object.defineProperty(document, 'cookie', {
    get() { if (denied) throw Error('cookies blocked'); return cookies; },
    set(value) { if (denied) throw Error('cookies blocked'); writes.push(value); cookies = value.split(';')[0]; }
  });
  vm.runInNewContext(read('assets/update.js'), { document, URL });
  return { dialog, writes, link, closeButton, classes };
}

test('first visit shows the notice and remembers the displayed version', () => {
  const first = openPage();
  assert.equal(first.dialog.shown, 1);
  assert.equal(first.writes.length, 1);
  assert.match(first.writes[0], new RegExp(`^${cookieName}=`));
  assert.match(first.writes[0], /Max-Age=31536000/);
  assert.match(first.writes[0], /Path=\/gift\//);
  assert.match(first.writes[0], /SameSite=Lax/);
  assert.match(first.writes[0], /; Secure/);
  assert.equal(first.link.href, 'https://example.com/gift/northern_lights/index.html');
  const seen = first.writes[0].split(';')[0];
  assert.equal(openPage({ cookies: `unrelated=yes; ${seen}` }).dialog.shown, 0);
  first.closeButton.click();
  assert.equal(first.dialog.open, false);
  assert.equal(first.dialog.removed, true);
  assert.equal(first.classes.size, 0, 'background scrolling is restored');
});

test('old versions and similarly named cookies do not hide a new update', () => {
  assert.equal(openPage({ cookies: `${cookieName}=previous-release` }).dialog.shown, 1);
  const seen = openPage().writes[0].split(';')[0];
  assert.equal(openPage({ cookies: `other_${seen}` }).dialog.shown, 1);
});

test('HTTP preview can remember the notice without a Secure cookie', () => {
  const page = openPage({ secure: false });
  assert.equal(page.dialog.shown, 1);
  assert.doesNotMatch(page.writes[0], /; Secure/);
});

test('cookie failure does not break the modal or world navigation', () => {
  const page = openPage({ denied: true });
  assert.equal(page.dialog.shown, 1);
  page.closeButton.click();
  assert.equal(page.dialog.removed, true);
});

test('an unseen notice is never marked as displayed', () => {
  const page = openPage({ showFails: true });
  assert.equal(page.writes.length, 0);
  assert.equal(page.classes.size, 0);
});

test('the removed world has no live files or navigation', () => {
  for (const file of ['birthday/index.html', 'birthday/celebration.js', 'assets/birthday.css', 'assets/home.js']) {
    assert.equal(fs.existsSync(new URL('../' + file, import.meta.url)), false, file);
  }
  assert.doesNotMatch(read('index.html'), /birthday|Geburtstag/i);
  assert.doesNotMatch(read('assets/home.css'), /birthday/i);
  for (const file of ['index.html', 'under_quiet_stars/index.html', 'under_quiet_stars/cats.html', 'nights_embrace/index.html', 'northern_lights/index.html']) {
    assert.match(read(file), /src="(?:\.\.\/)?assets\/update\.js"/);
  }
});

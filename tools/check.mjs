import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const pages = ['index.html', 'under_quiet_stars/index.html', 'under_quiet_stars/cats.html', 'nights_embrace/index.html', 'northern_lights/index.html'];
let failures = 0;
function check(condition, message) { if (!condition) { console.error(message); failures++; } }
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (url.startsWith('#') || url.startsWith('data:')) continue;
    check(!/^https?:/.test(url), `${page}: external runtime dependency ${url}`);
    check(fs.existsSync(path.resolve(root, path.dirname(page), url)), `${page}: missing ${url}`);
  }
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1], { filename: page });
  check(html.includes('lang="de"'), `${page}: missing German language`);
  check(html.includes('viewport-fit=cover'), `${page}: missing full-screen viewport`);
  check(!html.includes('user-scalable=no'), `${page}: zoom disabled`);
  console.log(`Checked ${page}`);
}
for (const dir of ['assets', 'under_quiet_stars', 'northern_lights']) {
  for (const name of fs.readdirSync(path.join(root, dir))) if (name.endsWith('.js')) new vm.Script(fs.readFileSync(path.join(root, dir, name), 'utf8'), { filename: path.join(dir, name) });
}
new vm.Script(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), { filename: 'sw.js' });
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
for (const icon of manifest.icons) {
  const bytes = fs.readFileSync(path.join(root, icon.src));
  check(icon.sizes === `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, 'Manifest icon dimensions do not match PNG');
}
if (failures) process.exitCode = 1;
else console.log('All local paths, JavaScript syntax, metadata and icon dimensions valid.');

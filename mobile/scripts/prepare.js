// Builds mobile/www from the desktop UI (../app) + the PS1 emulator (EmulatorJS, GPL-3.0, PCSX ReARMed core).
// Run from the mobile folder:  node scripts/prepare.js
const fs = require('fs'), path = require('path');
const here = path.join(__dirname, '..'), app = path.join(here, '..', 'app'), www = path.join(here, 'www');
const ejs = path.join(here, 'node_modules', '@emulatorjs', 'emulatorjs', 'data');
const core = path.join(here, 'node_modules', '@emulatorjs', 'core-pcsx_rearmed');
fs.rmSync(www, { recursive: true, force: true });
fs.cpSync(app, www, { recursive: true });
const dst = path.join(www, 'vendor', 'emulatorjs');
for (const f of ['loader.js', 'emulator.css', 'version.json']) fs.cpSync(path.join(ejs, f), path.join(dst, f));
for (const d of ['src', 'compression']) fs.cpSync(path.join(ejs, d), path.join(dst, d), { recursive: true });
fs.mkdirSync(path.join(dst, 'localization'), { recursive: true });
for (const l of ['tr-TR', 'en-US']) { const s = path.join(ejs, 'localization', l + '.json'); if (fs.existsSync(s)) fs.cpSync(s, path.join(dst, 'localization', l + '.json')); }
fs.mkdirSync(path.join(dst, 'cores', 'reports'), { recursive: true });
for (const f of fs.readdirSync(core)) if (/\.data$/.test(f)) fs.cpSync(path.join(core, f), path.join(dst, 'cores', f));
fs.cpSync(path.join(core, 'reports', 'pcsx_rearmed.json'), path.join(dst, 'cores', 'reports', 'pcsx_rearmed.json'));
fs.writeFileSync(path.join(dst, 'LICENSE-EmulatorJS.txt'), fs.readFileSync(path.join(ejs, '..', 'LICENSE')));
const size = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((a, e) => a + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log('www ready:', (size(www) / 1e6).toFixed(1), 'MB');

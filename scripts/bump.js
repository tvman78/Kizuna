// Increments the last digit of the version (1.0.1 -> 1.0.2) everywhere it appears and prints the new version:
// package.json, mobile/package.json, the <meta name="kizuna-version"> tag and the rail label in app/index.html.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const f = path.join(root, 'package.json');
const p = JSON.parse(fs.readFileSync(f, 'utf8'));
const v = p.version.split('.').map(Number); v[2]++;
p.version = v.join('.');
fs.writeFileSync(f, JSON.stringify(p, null, 2) + '\n');
const mp = path.join(root, 'mobile', 'package.json');
if (fs.existsSync(mp)) { const m = JSON.parse(fs.readFileSync(mp, 'utf8')); m.version = p.version; fs.writeFileSync(mp, JSON.stringify(m, null, 2) + '\n'); }
const ip = path.join(root, 'app', 'index.html');
let html = fs.readFileSync(ip, 'utf8');
html = html.replace(/(<meta name="kizuna-version" content=")[^"]*(")/, `$1${p.version}$2`).replace(/(<small id="railVer">v)[^<]*(<\/small>)/, `$1${p.version}$2`);
fs.writeFileSync(ip, html);
console.log(p.version);

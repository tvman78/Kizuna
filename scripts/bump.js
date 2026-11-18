// Sürüm numarasının son hanesini 1 artırır (1.0.1 -> 1.0.2) ve yeni sürümü yazdırır.
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, '..', 'package.json');
const p = JSON.parse(fs.readFileSync(f, 'utf8'));
const v = p.version.split('.').map(Number); v[2]++;
p.version = v.join('.');
fs.writeFileSync(f, JSON.stringify(p, null, 2) + '\n');
console.log(p.version);

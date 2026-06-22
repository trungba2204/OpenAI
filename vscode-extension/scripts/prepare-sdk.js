const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sdkSrc = path.join(root, '..', 'plugin-sdk');
const sdkDest = path.join(root, 'vendor', 'plugin-sdk');

fs.rmSync(sdkDest, { recursive: true, force: true });
fs.mkdirSync(sdkDest, { recursive: true });

const pkg = JSON.parse(fs.readFileSync(path.join(sdkSrc, 'package.json'), 'utf8'));
const minimal = {
  name: pkg.name,
  version: pkg.version,
  main: 'dist/index.js',
  types: 'dist/index.d.ts'
};
fs.writeFileSync(path.join(sdkDest, 'package.json'), JSON.stringify(minimal, null, 2));

fs.cpSync(path.join(sdkSrc, 'dist'), path.join(sdkDest, 'dist'), { recursive: true });
console.log('Prepared plugin-sdk in vendor/plugin-sdk');

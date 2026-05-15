import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { minify } from 'html-minifier-terser';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = resolve(root, 'index.html');
const outputDir = resolve(root, 'dist');
const outputPath = resolve(outputDir, 'index.min.html');

const html = await readFile(inputPath, 'utf8');
const inputBytes = Buffer.byteLength(html, 'utf8');

const minified = await minify(html, {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  removeRedundantAttributes: false,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  minifyCSS: true,
  minifyJS: {
    mangle: false,
    compress: { drop_console: false },
    format: { comments: false },
  },
  caseSensitive: true,
  keepClosingSlash: true,
  customAttrAssign: [/:[A-Za-z-]+/, /@[A-Za-z-]+/, /v-[A-Za-z-]+/],
});

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, minified, 'utf8');

const outputBytes = Buffer.byteLength(minified, 'utf8');
const pct = ((1 - outputBytes / inputBytes) * 100).toFixed(1);

console.log(`✓ minified`);
console.log(`  in  : ${(inputBytes / 1024).toFixed(1)} KB  (${html.split('\n').length} lines)`);
console.log(`  out : ${(outputBytes / 1024).toFixed(1)} KB  (${minified.split('\n').length} lines)  → ${outputPath.replace(root + '/', '')}`);
console.log(`  saved: ${pct}%`);

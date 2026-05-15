import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { minify } from 'html-minifier-terser';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = resolve(root, 'index.html');
const outputDir = resolve(root, 'dist');

const html = await readFile(inputPath, 'utf8');
const inputBytes = Buffer.byteLength(html, 'utf8');

// ── 1. Full minified bundle (for hosts that allow inline CSS) ────────────────
const fullMinified = await minify(html, {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  minifyCSS: true,
  minifyJS: { mangle: false, compress: { drop_console: false }, format: { comments: false } },
  caseSensitive: true,
  keepClosingSlash: true,
  customAttrAssign: [/:[A-Za-z-]+/, /@[A-Za-z-]+/, /v-[A-Za-z-]+/],
});

await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, 'index.min.html'), fullMinified, 'utf8');

// ── 2. Split CSS + HTML for Simvoly (CSS goes in head, HTML in widget) ───────
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) throw new Error('No <style> block found in index.html');

const rawCss = styleMatch[1];
const minifiedCss = (await minify(`<style>${rawCss}</style>`, {
  minifyCSS: true,
  collapseWhitespace: true,
  removeComments: true,
})).replace(/^<style>|<\/style>$/g, '');

const htmlWithoutCss = html.replace(/<style>[\s\S]*?<\/style>/, '');
const minifiedHtmlNoCss = await minify(htmlWithoutCss, {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  removeScriptTypeAttributes: true,
  minifyJS: { mangle: false, compress: { drop_console: false }, format: { comments: false } },
  caseSensitive: true,
  keepClosingSlash: true,
  customAttrAssign: [/:[A-Za-z-]+/, /@[A-Za-z-]+/, /v-[A-Za-z-]+/],
});

await writeFile(resolve(outputDir, 'simvoly-custom-css.txt'), minifiedCss, 'utf8');
await writeFile(resolve(outputDir, 'simvoly-widget.html'),  minifiedHtmlNoCss, 'utf8');

// ── Report ──────────────────────────────────────────────────────────────────
const fullKB = (Buffer.byteLength(fullMinified, 'utf8') / 1024).toFixed(1);
const cssKB  = (Buffer.byteLength(minifiedCss, 'utf8') / 1024).toFixed(1);
const htmlKB = (Buffer.byteLength(minifiedHtmlNoCss, 'utf8') / 1024).toFixed(1);

console.log(`✓ minified (in: ${(inputBytes / 1024).toFixed(1)} KB)`);
console.log(``);
console.log(`  Full bundle (inline CSS):`);
console.log(`    dist/index.min.html         ${fullKB} KB`);
console.log(``);
console.log(`  Simvoly split (CSS in head + HTML in widget):`);
console.log(`    dist/simvoly-custom-css.txt ${cssKB} KB  → plak in Simvoly Custom CSS`);
console.log(`    dist/simvoly-widget.html    ${htmlKB} KB  → plak in Custom HTML widget`);

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { minify } from 'html-minifier-terser';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = resolve(root, 'index.html');
const outputDir = resolve(root, 'dist');
await mkdir(outputDir, { recursive: true });

const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/gh/cfconradie/boerseker@main/dist';

const html = await readFile(inputPath, 'utf8');
const inputBytes = Buffer.byteLength(html, 'utf8');

// ── 1. Extract <style>…</style> → dist/style.css ────────────────────────────
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) throw new Error('No <style> block found');
const minifiedCss = (await minify(`<style>${styleMatch[1]}</style>`, {
  minifyCSS: true,
  collapseWhitespace: true,
  removeComments: true,
})).replace(/^<style>|<\/style>$/g, '');
await writeFile(resolve(outputDir, 'style.css'), minifiedCss, 'utf8');

// ── 2. Extract <div id="boerseker-app" v-cloak>…</div> template ─────────────
const mountOpen = html.indexOf('<div id="boerseker-app"');
if (mountOpen === -1) throw new Error('Could not find #boerseker-app mount div');

// Walk forward counting <div>/</div> depth to find the matching close.
let depth = 0;
let i = mountOpen;
let templateEnd = -1;
const divOpen = /<div\b/gi;
const divClose = /<\/div>/gi;
while (i < html.length) {
  divOpen.lastIndex = i;
  divClose.lastIndex = i;
  const oMatch = divOpen.exec(html);
  const cMatch = divClose.exec(html);
  if (!cMatch) break;
  if (oMatch && oMatch.index < cMatch.index) {
    depth++;
    i = oMatch.index + oMatch[0].length;
  } else {
    depth--;
    if (depth === 0) {
      templateEnd = cMatch.index + cMatch[0].length;
      break;
    }
    i = cMatch.index + cMatch[0].length;
  }
}
if (templateEnd === -1) throw new Error('Could not find matching </div> for #boerseker-app');

const rawTemplate = html.slice(mountOpen, templateEnd);
// Minify the template as a standalone fragment.
const minifiedTemplate = await minify(rawTemplate, {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  caseSensitive: true,
  keepClosingSlash: true,
  customAttrAssign: [/:[A-Za-z-]+/, /@[A-Za-z-]+/, /v-[A-Za-z-]+/],
});

// ── 3. Extract the last inline <script> (the Vue app code) ──────────────────
const scriptBlocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
if (scriptBlocks.length === 0) throw new Error('No inline <script> block found');
const appJs = scriptBlocks[scriptBlocks.length - 1][1];

// ── 4. Inject template into the createApp() call ────────────────────────────
// Original: createApp({\n  setup() { ... }\n}).mount('#boerseker-app');
// We add a template: option pointing at a global string we declare.
const TEMPLATE_VAR = '__BOERSEKER_TPL__';
const patchedAppJs = appJs.replace(
  /createApp\(\s*\{/,
  `createApp({\n  template: ${TEMPLATE_VAR},`
);
if (!patchedAppJs.includes(`template: ${TEMPLATE_VAR}`)) {
  throw new Error('Could not patch createApp() — template injection failed');
}

// ── 5. Compose embed.js — self-bootstrapping IIFE ───────────────────────────
// Use backticks for the template literal. The template has no backticks (verified).
// Escape any backslashes and backticks defensively.
const safeTemplate = minifiedTemplate.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const embedJs = `/*! Boerseker self-bootstrapping widget */
(function () {
  // 1. Inject stylesheet via DOM (bypasses host-page <link> sanitizers).
  if (!document.getElementById('boerseker-style')) {
    var l = document.createElement('link');
    l.id = 'boerseker-style';
    l.rel = 'stylesheet';
    l.href = '${JSDELIVR_BASE}/style.css';
    document.head.appendChild(l);
  }

  // 2. Template (extracted from index.html).
  var ${TEMPLATE_VAR} = \`${safeTemplate}\`;

  // 3. Wait for Vue + DOM, then mount.
  function boot() {
    if (typeof Vue === 'undefined') return setTimeout(boot, 20);
    if (!document.getElementById('boerseker-app')) {
      // Host page didn't include the mount div — create one.
      var d = document.createElement('div');
      d.id = 'boerseker-app';
      document.body.appendChild(d);
    }
    /* === BEGIN extracted app logic === */
${patchedAppJs}
    /* === END extracted app logic === */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`;

await writeFile(resolve(outputDir, 'embed.js'), embedJs, 'utf8');

// ── 6. Produce the 3-line snippet for the client ────────────────────────────
const snippet = `<div id="boerseker-app"></div>
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="${JSDELIVR_BASE}/embed.js"></script>
`;
await writeFile(resolve(outputDir, 'simvoly-snippet.html'), snippet, 'utf8');

// ── 7. Full-bundle minified (still useful for the Vercel-hosted page) ───────
const fullMinified = await minify(html, {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: { mangle: false, compress: { drop_console: false }, format: { comments: false } },
  caseSensitive: true,
  keepClosingSlash: true,
  customAttrAssign: [/:[A-Za-z-]+/, /@[A-Za-z-]+/, /v-[A-Za-z-]+/],
});
await writeFile(resolve(outputDir, 'index.min.html'), fullMinified, 'utf8');

// ── Report ──────────────────────────────────────────────────────────────────
const sizes = {
  input:    inputBytes,
  full:     Buffer.byteLength(fullMinified, 'utf8'),
  css:      Buffer.byteLength(minifiedCss, 'utf8'),
  embed:    Buffer.byteLength(embedJs, 'utf8'),
  snippet:  Buffer.byteLength(snippet, 'utf8'),
  template: Buffer.byteLength(minifiedTemplate, 'utf8'),
};
const kb = b => (b / 1024).toFixed(1) + ' KB';
console.log(`✓ minified (in: ${kb(sizes.input)})`);
console.log(``);
console.log(`  Vercel-hosted full page:`);
console.log(`    dist/index.min.html       ${kb(sizes.full)}`);
console.log(``);
console.log(`  Simvoly embed (jsDelivr-served):`);
console.log(`    dist/style.css            ${kb(sizes.css)}`);
console.log(`    dist/embed.js             ${kb(sizes.embed)}  (template ${kb(sizes.template)} + app logic)`);
console.log(`    dist/simvoly-snippet.html ${kb(sizes.snippet)}  ← plak in Simvoly Custom HTML`);

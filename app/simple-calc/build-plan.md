# Simple Calculator — Build Plan

> Hero-section refinance teaser. User types a desired loan amount, instantly sees the asset-value range they need to qualify, then is invited (broker-style) into the deeper qualifier.

**Stack:** Vue 3 (CDN) · Vanilla CSS (inline `<style>`) · Single `index.html`
**Goals:** Speed (sub-2s LCP, no build step, no runtime CSS compiler), reactivity (live as user types), trust (feels like a broker, not a form)

---

## 0. Who & Where

**The user** — A South African farmer sitting in his tractor who needs cash. He's not a financial expert. He has an amount in mind ("I need R500k to fix the irrigation / buy seed / cover this season") and he wants to know — in 10 seconds, on his phone — whether that's even realistic for someone in his position.

**Where it lives** — Inside the **hero section** of the client's existing landing page. First thing the visitor sees. No scroll required. No form. No friction.

**The role in the funnel** — This is the **gateway** to the detailed qualifier (Step 2). It does one job: convert curiosity into a click. The math is intentionally rough. The point is to give the farmer a believable answer fast, then hand him to the broker-style CTA that takes him into the proper qualification flow where assets are itemised, condition is captured, etc.

```
Hero (this widget)  →  CTA  →  Step 2: Complex Qualifier  →  Lead capture  →  CRM
   ↑ you are here
```

The simple calc is **not** trying to give an accurate quote. It's trying to earn the right to ask for more information.

---

## 1. File Structure

```
Step 1/simple-calc/
├── build-plan.md       ← this file
└── index.html          ← everything: markup, <style>, Vue app
```

One file. No build, no bundler, no node_modules, no CSS framework. Drop into the client's site as an iframe or copy-paste the `<div id="boerseker-calc">` block + the `<style>` block + the Vue CDN `<script>` tag.

### Why single-file
- Fewer HTTP requests → faster first paint
- Trivially embeddable
- Client (or future dev) can read the whole thing top-to-bottom in 5 minutes
- No tooling to maintain

---

## 2. HTML Document Structure

The whole widget lives in one `index.html`. Below is the skeleton — fill in the styles, template, and Vue logic in the marked sections.

```html
<!DOCTYPE html>
<html lang="en-ZA">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="description" content="Refinance estimate calculator — see what assets you need to qualify.">
  <title>Refinance Estimator — Boerseker</title>

  <!-- Vue 3 production CDN (single dependency, ~35KB gzipped) -->
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>

  <style>
    /* ---------- 1. Design tokens (CSS custom properties) ---------- */
    :root {
      --color-bg: #fafaf9;
      --color-surface: #ffffff;
      --color-ink: #1c1c1c;
      --color-muted: #6b6b6b;
      --color-primary: #1a4d3a;       /* placeholder — replace with brand */
      --color-primary-soft: #e8f1ed;
      --color-border: #e5e5e5;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 24px;
      --space-6: 32px;
      --font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --shadow-card: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06);
      --duration-fast: 180ms;
      --duration-base: 240ms;
      --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    /* ---------- 2. Scoped reset (only inside the widget root) ---------- */
    .boerseker-calc, .boerseker-calc * { box-sizing: border-box; }
    .boerseker-calc { font-family: var(--font-stack); color: var(--color-ink); line-height: 1.5; }

    /* ---------- 3. v-cloak guard (prevents unstyled flash) ---------- */
    [v-cloak] { display: none !important; }

    /* ---------- 4. Component styles ---------- */
    /* .calc-card { ... }     */
    /* .calc-input { ... }    */
    /* .calc-result { ... }   */
    /* .advisor { ... }       */
    /* .speech-bubble { ... } */
    /* .cta-soft-choice { ... } */
    /* .trust-chip { ... }    */

    /* ---------- 5. Animations ---------- */
    /* @keyframes fadeUp { ... } */
    /* @keyframes typingDot { ... } */

    /* ---------- 6. Responsive (mobile-first, single breakpoint) ---------- */
    /* @media (min-width: 640px) { ... } */

    /* ---------- 7. Reduced-motion guard ---------- */
    @media (prefers-reduced-motion: reduce) {
      .boerseker-calc *, .boerseker-calc *::before, .boerseker-calc *::after {
        animation-duration: 0.001ms !important;
        transition-duration: 0.001ms !important;
      }
    }
  </style>
</head>
<body>

  <!-- Mount root. ID is namespaced so it can't collide with the parent site. -->
  <div id="boerseker-calc" class="boerseker-calc" v-cloak data-step2-url="#step-2">
    <!-- Vue template goes here (see section 3 for the structure) -->
  </div>

  <script>
    const { createApp, ref, computed, watch } = Vue;
    createApp({
      setup() {
        // refs, computeds, watchers (see section 3)
        return { /* ... */ };
      }
    }).mount('#boerseker-calc');
  </script>

</body>
</html>
```

### Why this skeleton

| Choice | Reason |
|---|---|
| `<!DOCTYPE html>` + `lang="en-ZA"` | Standards mode + South African English locale (helps screen readers and date/number defaults) |
| `meta viewport` | Mobile-responsive baseline |
| `meta color-scheme: light` | Prevents the iframe from inheriting the parent site's dark mode unexpectedly |
| Vue 3 **prod** build | Smaller and faster than `vue.global.js` (dev build) |
| Single `<style>` block | Zero network round-trips for CSS, no FOUC |
| **CSS custom properties at `:root`** | One place to re-theme when client branding lands — same benefit a Tailwind config gives, with zero runtime |
| **Scoped class root** (`.boerseker-calc`) | All component styles nest under this class so nothing leaks into the parent page when inlined (no need for Tailwind preflight, no need for an iframe just for CSS isolation) |
| `[v-cloak]` rule | Hides the unrendered template until Vue mounts → no flash of `{{ mustache }}` |
| `data-step2-url` on the mount element | Embed page can override the CTA target without touching JS |
| `prefers-reduced-motion` block | Accessibility — disables all animations for users who request it |

### Why vanilla CSS over Tailwind CDN

| | Tailwind Play CDN | Vanilla CSS (this plan) |
|---|---|---|
| Network | ~80KB gzipped runtime + JIT compiler | ~3–5KB inline, zero runtime |
| First paint | Render-blocked until JIT scans the DOM | Instant — parsed once with the HTML |
| Embed safety | Tailwind's `preflight` resets the parent site's styles → forces iframe | Scoped under `.boerseker-calc`, safe to inline directly |
| Production ready | Tailwind explicitly says Play CDN is **not for production** | Yes — ship as-is |
| Theming | Tailwind config (rebuild required) | CSS variables (live, no rebuild) |
| Debuggability | DevTools shows long class strings | DevTools shows readable component names |

For a single widget with ~6 elements, vanilla CSS wins on every axis.

---

## 3. Vue App Architecture (Composition API)

Single root component, mounted on `#app`. No child components — premature for this scope.

### Reactive State
| Ref | Type | Purpose |
|---|---|---|
| `desiredAmount` | `ref<number \| null>` | Raw user input (cents-free, ZAR rands) |
| `hasInteracted` | `ref<boolean>` | Toggles result reveal — flips true on first valid input |
| `advisorTyping` | `ref<boolean>` | Drives the "advisor is thinking" dots animation |

### Computed
| Computed | Formula | Notes |
|---|---|---|
| `lowerBound` | `desiredAmount / 0.40` | Asset value at the optimistic end |
| `upperBound` | `desiredAmount / 0.30` | Asset value at the conservative end |
| `isValid` | `desiredAmount > 0 && desiredAmount <= 100_000_000` | Sanity bounds (R0–R100m) |
| `formattedLower` | `Intl.NumberFormat('en-ZA', {style:'currency', currency:'ZAR', maximumFractionDigits:0})` | Native ZAR formatting |
| `formattedUpper` | same | |
| `formattedInput` | thousand-separator display only | Input shown formatted while user types |

### Why computed (not methods or watchers)
Computed values are Vue's most efficient reactivity primitive — they cache and only recalculate when their reactive dependencies change. Every keystroke triggers exactly one recalculation, no debounce needed for math this cheap.

### Template Flow
```
<div id="boerseker-calc" class="boerseker-calc">
  ├─ Hero heading + subtext
  ├─ Calculator card (.calc-card)
  │   ├─ Currency input (R prefix, live-formatted) (.calc-input)
  │   ├─ Helper line (validation / hint) (.calc-helper)
  │   └─ Result block (.calc-result, v-show="isValid && hasInteracted")
  │       ├─ Range display: "R 1,250,000 – R 1,666,667"
  │       └─ Plain-language sentence
  └─ Advisor CTA section (.advisor, v-show="isValid && hasInteracted")
      ├─ Advisor avatar + name
      ├─ Typing dots (.typing-dots, during advisorTyping)
      ├─ Speech bubble (.speech-bubble): conversational microcopy
      ├─ Two-option soft choice (.cta-soft-choice): primary + ghost
      └─ Trust chips row (.trust-chips)
</div>
```

---

## 4. Reactivity & Speed Mechanics

### Live update, no button
- `<input v-model.number="desiredAmount">` — value flows into the ref on every keystroke
- Computeds recalculate automatically
- Result block fades in the first time `isValid` flips true (`hasInteracted` latch)
- Subsequent edits update the numbers in place — no re-mount, no re-animation

### Input UX
- `inputmode="numeric"` for mobile number pad
- Display value is formatted with thousand separators (`R 1 250 000`); the underlying ref stores a raw number
- Strip non-digits on input, re-format on display — single small handler
- Cursor position preserved using selectionStart save/restore (small but matters on desktop)

### First-paint speed
- **System font stack** at first paint (no webfont download blocking text render). Client can swap in a brand font later via the `--font-stack` variable.
- **Inline `<style>` block** — CSS is parsed in the same document, no extra round-trip
- `v-cloak` on root + a `[v-cloak]{display:none}` rule prevents the unstyled-template flash
- Result block uses `v-show` (not `v-if`) — DOM stays mounted, toggles are instant
- **Only one third-party JS dependency**: Vue 3 production build (~35KB gzipped). Nothing else.

---

## 5. The CTA Section — "Trusted Broker" UX

> Researched from current (2024–2026) fintech UX patterns (Monzo, Wealthsimple, Klarna, Lendi, Athena Home Loans). The CTA does **not** look like a button.

**Job to be done:** Bridge the farmer from the rough estimate into the **complex calculator (Step 2)** without making him feel like he's being funneled. The estimate has earned a moment of his attention — now we use that moment to get him to commit to the longer qualification flow where we capture itemised assets, condition, credit posture, and ultimately his contact details for the CRM.

### Layout
```
┌──────────────────────────────────────────────┐
│  [Avatar]  Johan, Senior Refinance Advisor   │
│            ● ● ●   ← typing dots (~800ms)    │
│            ┌─────────────────────────────┐   │
│            │ "That's just an estimate.   │   │
│            │  Want me to check if you    │   │
│            │  actually qualify?"         │   │
│            └─────────────────────────────┘   │
│                                              │
│   [ Yes, walk me through it →  ]   I'm just  │
│   (primary, soft-shadow card)      browsing  │
│                                    (ghost)   │
│                                              │
│   🔒 Soft check only · No credit impact      │
│   ⏱  Real advisor replies within 2 hours    │
│   🇿🇦  NCR Registered Credit Provider        │
└──────────────────────────────────────────────┘
```

### Pattern choices (and why each)

| Element | Pattern | Reason |
|---|---|---|
| **Avatar + name** | Real-feeling person ("Johan, Senior Refinance Advisor") | Named humans convert better than logos. Removes the "form" feeling. |
| **Typing dots** | 3 bouncing dots for ~800ms before message appears | The single highest-impact "human" micro-pattern. Replicates a broker thinking. |
| **Speech bubble** | Rounded card with tail, sequenced fade-up | Reads as conversation, not marketing copy. |
| **Soft-choice pair** | Primary "Yes, walk me through it" + ghost "I'm just browsing" | The ghost option *increases* primary click-through by removing commitment anxiety. |
| **No "APPLY NOW" button** | Headline-as-CTA / inline question framing | Generic CTA buttons feel like funnels. The question pulls the user in. |
| **Trust chips** | 3 small pills with icons, directly under the CTA | Compliance + reassurance + response-time promise. Each one short. |

### Animation sequence (after first valid input)
1. **0ms** — Result number fades up (`translateY(8px) → 0`, `opacity 0 → 1`, 240ms ease-out)
2. **+120ms** — Supporting sentence fades in
3. **+380ms** — Advisor section slides in from below
4. **+380ms** — Typing dots appear, `advisorTyping = true`
5. **+1180ms** — `advisorTyping = false`, speech bubble fades in
6. **+1380ms** — Soft-choice buttons + trust chips fade in (staggered 80ms)

> Total time-to-CTA after first valid input: ~1.4s. Feels considered, not eager. Replicates the rhythm of a human about to speak.

### Animation implementation
- **CSS `@keyframes`** for the typing dots and the fade-up reveal
- **CSS transitions** on `opacity` and `transform` for the staggered reveals
- A small `watch(isValid, ...)` in Vue flips reactive flags (`showResult`, `showAdvisor`, `advisorTyping`) on `setTimeout`s — Vue toggles classes, CSS does the actual animating
- No animation library
- All animations short-circuited by the `@media (prefers-reduced-motion: reduce)` block in section 2

### Microcopy bank (for the speech bubble)
Pick one — to be A/B'd later:
- *"That's just an estimate. Want me to check if you actually qualify?"*
- *"Looks like you might be in range. Shall we confirm properly?"*
- *"Based on this, I'd need to know a bit more to give you a real answer."*

### Trust chips (final copy TBD with client)
- 🔒 Soft check only · No credit impact
- ⏱ Real advisor replies within 2 hours
- 🇿🇦 NCR Registered Credit Provider *(pending client confirmation)*

### CTA destination
- Primary action → Step 2 (URL TBD; placeholder `#step-2` for now)
- Configurable via a `data-step2-url` attribute on the mount element so the embed page can override without editing JS
- Ghost action → no-op for now (could later trigger an "email me later" capture)

---

## 6. Anti-Patterns We're Explicitly Avoiding

These came up in the research as scam/old-school markers — none of them appear in this build:

- ❌ Giant gradient "APPLY NOW" / "GET STARTED" buttons in all-caps
- ❌ Urgency countdown timers
- ❌ Blurred-result email gates ("unlock your estimate")
- ❌ Exit-intent popups
- ❌ Stock "happy family" hero photography
- ❌ Pulsing/glowing/bouncing CTA buttons
- ❌ Auto-scroll hijacking after result appears
- ❌ Generic "AI assistant" chat bubble (contradicts the *real broker* positioning — if there's an avatar, it's a named human)
- ❌ Multiple competing CTAs on the same fold
- ❌ Progress bars that start at 60% to fake progress

---

## 7. Accessibility Baseline

- `<label>` properly associated with the input
- `aria-live="polite"` on the result block so screen readers announce updates
- Keyboard-reachable CTA links (`<a>` or `<button>`, not div)
- Color contrast min AA — to be confirmed once branding lands
- `prefers-reduced-motion` respected (all transitions become instant)
- Focus ring preserved on the input and CTA elements

---

## 8. Embedding Strategy

Two ways the client can drop this onto their site:

1. **Inline copy** (recommended — now safe because of vanilla CSS)
   Copy three things into the host page:
   - The `<style>` block (all selectors are scoped under `.boerseker-calc` so nothing leaks)
   - The `<div id="boerseker-calc" class="boerseker-calc">…</div>` markup
   - The Vue CDN `<script>` tag + the small `createApp` script

2. **iframe** (use if the client's CMS won't allow custom `<script>` tags)
   `<iframe src="…/simple-calc/" width="100%" height="640" style="border:0"></iframe>`

> **Why inline is now viable:** because there's no Tailwind preflight resetting the parent page, and all our CSS rules are namespaced under `.boerseker-calc`, the widget can sit inside the client's existing page without style collisions either way.

---

## 9. Open Questions / Pending

| Item | Owner | Blocking? |
|---|---|---|
| Step 2 URL (CTA target) | Will exist after Step 2 is built | No — placeholder works |
| Brand colors, fonts, logo | Client | No — we use neutral greys until then |
| Final advisor name + headshot | Client | No — placeholder OK |
| NCR registration number / exact compliance line | Client | No — chip can launch without |
| Brand font choice (override `--font-stack`) | Client | No — system stack OK |
| Ghost-button behavior ("I'm just browsing") | Client preference | No — defaults to no-op |

---

## 10. Build Order (when implementation starts)

1. Scaffold `index.html` per the section 2 skeleton — doctype, head, Vue CDN, empty `<style>` with token block, empty `#boerseker-calc` mount root
2. Wire up the input and computed range — confirm reactivity is instant (no styles needed yet)
3. Add result block with ZAR formatting + `hasInteracted` latch
4. Drop in baseline component CSS (cards, input, result) — readable layout, no animations yet
5. Add advisor avatar + speech bubble markup
6. Add typing-dots → message reveal sequence (CSS keyframes + Vue watch)
7. Add soft-choice pair + trust chips
8. Tune animation timings; verify `prefers-reduced-motion` short-circuits everything
9. Test inline embed inside a throwaway host page (style isolation check)
10. Hand off to Chris for the styling/branding pass — he tweaks `:root` variables and component classes

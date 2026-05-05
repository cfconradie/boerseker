# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Boerseker is a South African agricultural refinancing tool — two embeddable calculators built as single `index.html` files. No build step, no bundler, no node_modules. The entire stack is Vue 3 (loaded via CDN), vanilla CSS, and inline JavaScript.

## Development

Open `index.html` directly in a browser, or run a local server to avoid CORS issues with `fetch`:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

There are no lint, build, or test commands.

## Architecture

### Two-step funnel

```
Step 1: Simple Calc (index.html)
  → CTA with ?loan=AMOUNT
  → Step 2: Complex Qualifier (complex-calc/index.html, not yet built)
  → Lead form (3 fields: name, phone, email)
  → CRM (Zoho webhook, URL TBD — placeholder constant at top of script)
```

### Step 1 — Simple calc (`index.html`)

The hero widget. User types a desired loan amount and instantly sees the asset range they need to qualify. Implemented as a single-root Vue 3 Composition API app mounted on `#boerseker-calc`.

Key reactive state:
- `desiredAmount` ref drives all output
- `lowerBound` / `upperBound` computed from `desiredAmount / 0.40` and `desiredAmount / 0.30`
- `hasInteracted` latch reveals the result + advisor CTA section on first valid input
- `advisorTyping` drives the "broker thinking" dots sequence (~800ms delay before speech bubble)

The CTA target URL is configurable via `data-step2-url` on the mount element — embed pages can override it without touching JS.

### Step 2 — Complex qualifier (planned, `complex-calc/index.html`)

Not yet built. Per `docs/complex-calc-build-plan.md`:
- Reads `?loan=` from URLSearchParams to set the goal
- User adds assets via chip selectors (category, age, condition) + a value input
- Sticky top bar shows a progress bar filling toward the loan goal
- Calculation engine (`engine.js`) is inlined — if the engine changes, the inlined copy must be synced
- Lead form modal is gated: final result is only revealed after form submission
- CRM payload includes full asset bundle + calculated result

### CSS approach

All styles are inline in `<style>`. Design tokens live in `:root` CSS custom properties. All component styles are scoped under `.boerseker-calc` (Step 1) and `.boerseker-complex-calc` (Step 2) so the widget can be inlined into a host page without style leakage.

To retheme: edit the `:root` block — colors, radii, shadows, font stack.

### Calculation logic

- Collateral is a fraction of market value, adjusted by age and condition factors (per Annexure 1 from the client)
- LTV applied on top of collateral based on `credit_record` — defaults to `good` (0.40)
- Monthly payment uses the standard PMT formula at the configured term + rate
- Defaults: `credit_record: good`, `loan_term_months: 60`, `annual_interest_rate: 0.18`

### Copy language

The Step 1 UI (index.html) mixes English and Afrikaans. The Step 2 complex calc is fully Afrikaans. Final copy review with the client is pending before launch.

### Embedding

Two options per the build plans:
1. **Inline** — copy `<style>` block + mount div + CDN script + `createApp` script into host page. Safe because all CSS is namespaced.
2. **iframe** — point at the standalone `index.html`. Preferred for the complex calc in Phase 1 due to the sticky bar and modal.

## Pending / open items

- Zoho CRM webhook URL (placeholder constant in the complex-calc script)
- Final client branding (colors, fonts, advisor headshot, NCR registration line)
- `complex-calc/index.html` — not yet built; see `docs/complex-calc-build-plan.md`
- Step 2 URL to wire up in the simple-calc CTA (`data-step2-url` attribute)

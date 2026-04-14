# Complex Calculator — Build Plan

> Step-2 qualifier. The farmer arrives from the simple-calc CTA with a loan amount in mind. He adds his assets, watches a progress bar fill toward his goal, then converts via a mandatory lead form. The final loan number is gated behind that form.

**Stack:** Vue 3 (CDN) · Vanilla CSS (inline `<style>`) · Single `index.html`
**Engine:** Reuses `Step 1/engine.js` (Annexure 1 logic) — inlined for self-containment
**Goal:** 5-minute farmer-in-tractor experience. Minimum clicks. Maximum dopamine.

---

## 0. Persona & Pressure

Same farmer from the simple-calc, now in the qualifier. He arrived because he saw an estimate and wants to know what he can actually borrow.

**Constraints he's under:**
- He's on his phone, possibly in a moving tractor
- He's stressed about money
- He has 5 minutes of attention max
- He may abandon at any moment
- He must NOT feel like he's filling in a form

**Therefore:**
- No multi-step wizards
- No "next" buttons between fields
- No mandatory text entry except the lead form at the very end
- Chips and big touch targets everywhere
- Every interaction must produce a visible reward

---

## 1. File Structure

```
Step 1/complex-calc/
├── build-plan.md       ← this file
└── index.html          ← markup, inline <style>, inline engine, Vue app
```

`index.html` inlines a copy of the calculation engine (synced with `Step 1/engine.js`). Single-file embeddable, same pattern as simple-calc. A header comment marks the inlined block as "keep in sync with engine.js".

---

## 2. How the Farmer Arrives

The simple-calc CTA links to:
```
../complex-calc/?loan=500000
```

`index.html` reads `loan` from `URLSearchParams` on mount. If missing or invalid, defaults to **R 500,000** and shows a small `← Wysig bedrag` link back to the simple calc.

The loan amount becomes the **goal** the progress bar fills toward.

---

## 3. Layout — "The Cockpit"

Single-column, mobile-first. Three fixed regions stacked top-to-bottom:

```
┌────────────────────────────────────────┐
│  STICKY TOP BAR                        │
│  ───────────────────────────────────   │  ← progress bar
│  R 1.2m / R 2.5m  ·  48%  ·  R1.3m to go │  ← live numbers
│  "Jou doel: R500 000 lening"           │
├────────────────────────────────────────┤
│  Wat besit jy?                         │
│                                        │
│  ┌─ INLINE ADD-ASSET CARD ──────────┐ │
│  │ Wat is dit?                      │ │
│  │ [Trekker][Implements][Sproei]... │ │
│  │ Hoeveel werd?  R [        ]      │ │
│  │ Hoe oud?  [0–3][4–6][7–10][11+]  │ │
│  │ Toestand?  [Top][Goed][OK][Sleg] │ │
│  │                                  │ │
│  │              [ ✓ Voeg by ]       │ │  ← lights up when valid
│  └──────────────────────────────────┘ │
│                                        │
│  Jou bates (3)                         │
│                                        │
│  ┌─ Asset card 1 ─────────────────┐   │
│  │ 🚜 Trekker · R1 200 000        │   │
│  │ 7–10 jr · Goed · → R367 200 ✕  │   │
│  └────────────────────────────────┘   │
│  ┌─ Asset card 2 ─────────────────┐   │
│  │ 💧 Sproei · R350 000           │   │
│  │ 4–6 jr · Top · → R252 000   ✕  │   │
│  └────────────────────────────────┘   │
│                                        │
│  [▾ Gevorderd: krediet · termyn · koers]│  ← collapsible
│                                        │
│  ─────────────────────────────────     │
│                                        │
│  [  Wys my my lening  →  ]             │  ← gated CTA
│                                        │
└────────────────────────────────────────┘
```

### Region 1 — Sticky top bar (always visible)
- Progress bar fills as collateral grows
- Shows: current max-loan estimate / loan goal · % · amount remaining
- Live updates on every asset add/remove
- Subtle pulse animation on update (the dopamine moment)
- Color shifts: muted grey → orange (in progress) → green (goal reached)

### Region 2 — Add-asset card (always visible, top of scroll)
- Four chip rows + one number input
- "Voeg by" button initially disabled / muted; lights up orange when all 4 valid
- On add: card flashes briefly, asset slides into list below, form resets to blank
- Input value preserved formatting on display, raw number in state

### Region 3 — Asset list (grows downward)
- Each asset is a card with category icon, value, age/condition meta, calculated collateral
- Tap-X to delete (with subtle confirm — slide-out animation)
- Empty state: friendly Afrikaans message ("Voeg jou eerste bate by om te begin")

### Region 4 — Advanced settings (collapsed by default)
- Single disclosure: "Gevorderd"
- Reveals: credit record, loan term, interest rate
- Sensible defaults so the farmer never has to touch it for the happy path
- Changing any of these triggers an instant recalc and the bar updates

### Region 5 — The gated CTA
- Always visible at the bottom of the scroll, but only ENABLED once at least 1 asset is added
- Label changes contextually:
  - 0 assets: disabled, "Voeg minstens een bate by"
  - Below goal: "Wys my my lening →"
  - At/above goal: "Ek is reg — wys my →" (with a small celebration ✓ icon)
- Tap → opens the lead form modal/sheet

---

## 4. Asset Add UX — The Critical Moment

This is where the calculator earns its keep. Goal: **20 seconds per asset**, three taps + one number entry.

### The four fields, in chip form

| Field | Pattern | Options |
|---|---|---|
| **Category** | 8 chips, 2 rows of 4 | Trekker · Implements · Sproei · Planter · Baler · Combine · Ander · Besproeiing |
| **Market value** | Big number input with R prefix, live formatting | (typed) |
| **Age** | 4 chips | 0–3 jr · 4–6 jr · 7–10 jr · 11+ jr |
| **Condition** | 4 chips | Top · Goed · OK · Sleg |

### The reward sequence on Add
1. User taps "Voeg by"
2. Form briefly flashes green (200ms)
3. Asset card slides down out of the form into the list (300ms)
4. Form resets, all chips deselect, value clears
5. **Top bar fills** with a smooth animation (~600ms ease-out)
6. **The numbers count up** (counter animation, ~400ms)
7. If goal reached for the first time → small confetti / checkmark moment

### Why explicit button (not auto-add)
- User stays in control — no surprise additions while typing
- The button becoming bright orange is itself a satisfying signal ("ready to commit")
- One tap is acceptable for a deliberate action

### Defaults to consider
- No defaults on the chips — user has to actively pick. Defaults risk wrong data.
- Value input does NOT pre-fill, but placeholder shows "1 200 000" so the format is obvious.

---

## 5. Calculation Engine

Inlined from `Step 1/engine.js`. Functions exposed:
- `calculateAsset(input)` — returns `{collateral_value, max_loan, monthly_payment, total_repayment, total_finance_cost}` for a single asset given the full input bundle
- `formatZAR(n)` — locale-aware ZAR formatter

### Per-asset usage
When the user adds an asset, we call `calculateAsset` with the full input including the application defaults. We store the resulting `collateral_value` on the asset record.

### Aggregate
The total **max loan** is computed as:
```
total_collateral = sum(asset.collateral_value for asset in assets)
total_max_loan   = total_collateral × LTV[credit_record]
```

LTV defaults to `good` (0.40) until the farmer touches the advanced section.

### Monthly payment / total cost
Calculated from `total_max_loan` using the PMT formula at the application's term + rate. Shown on the **final result screen** (after lead capture), not in the running progress bar.

### Sync note
If `Step 1/engine.js` changes (Annexure 1 update from client), the inlined block in `complex-calc/index.html` MUST be updated to match. Header comment in the inlined block warns about this.

---

## 6. Application Defaults (hidden behind "Gevorderd")

| Field | Default | Why |
|---|---|---|
| `credit_record` | `'good'` | Optimistic; the bar fills faster, gives the farmer hope. Real number is reconciled by the broker after lead capture anyway. |
| `loan_term_months` | `60` | Max for `good` credit per Annexure 1 |
| `annual_interest_rate` | `0.18` | Typical SA refinance rate (per Annexure 1 example) |

These never block the happy path. The farmer can adjust them via the "Gevorderd" disclosure if he wants — and recalculation is instant.

---

## 7. The Lead Form (the gate)

Per the brief: **mandatory before showing final result.**

### Trigger
Tap the bottom CTA. A modal/sheet slides up from the bottom (mobile) or fades in centered (desktop).

### Fields
- Volle naam *
- Selfoon *
- E-pos *

That's it. No address, no ID number, no business info. Three fields. Get him through.

### Validation
- Name: at least 2 chars
- Phone: SA phone format (`0[678]\d{8}` or `+27[678]\d{8}`)
- Email: basic email regex
- Inline errors, not modal alerts

### Submit
- Disabled until all 3 valid
- On tap: submit to a placeholder endpoint (TBD CRM webhook)
- Optimistic UI: hide the form, show the final result IMMEDIATELY
- Background: POST the lead + the full asset bundle + the calculated result to the CRM endpoint
- If POST fails, show a small "Ons sal jou kontak" reassurance — never block the user from seeing his result

### What gets sent to CRM
```json
{
  "lead": { "name": "...", "phone": "...", "email": "..." },
  "loan_goal": 500000,
  "assets": [ { "category": "tractor", "market_value": 1200000, "age_years": 8, "condition": "good", "collateral_value": 612000 }, ... ],
  "application": { "credit_record": "good", "loan_term_months": 60, "annual_interest_rate": 0.18 },
  "result": { "total_collateral": 1500000, "max_loan": 600000, "monthly_payment": 15243, "total_repayment": 914580, "total_finance_cost": 314580 },
  "source": "complex-calc",
  "timestamp": "2026-04-11T..."
}
```

### CRM endpoint
For Phase 1, a placeholder URL constant at the top of the script. Easy to swap when the Zoho webhook is ready. Modular per the project notes ("keep CRM integration modular so Zoho can be swapped later").

---

## 8. The Final Result Screen

Revealed only after lead form submit. Replaces the calculator UI.

```
┌─────────────────────────────────────┐
│  ✓ Dankie, [Naam]                   │
│                                     │
│  Jy kwalifiseer vir tot             │
│  ╔═════════════════════════════╗   │
│  ║   R 600 000                  ║   │
│  ╚═════════════════════════════╝   │
│                                     │
│  Maandeliks:    R 15 243           │
│  Termyn:        60 maande           │
│  Totale terugbetaling: R 914 580   │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Johan kontak jou binne 2 ure.      │
│  ⏱ ⏱ ⏱                              │
│                                     │
│  [ Boer voort →  bel my nou ]       │
│                                     │
└─────────────────────────────────────┘
```

- Big number front and center (the final max loan)
- Supporting details below
- Trust restoration: same advisor name from simple-calc (Johan), 2-hour promise
- Optional secondary CTA: tel:link to call directly
- The farmer's name in the heading (personal touch)

---

## 9. Reactivity & Performance Mechanics

Same Composition API patterns as simple-calc:
- Refs for mutable state (assets list, draft fields, lead form fields)
- Computeds for derived values (totalCollateral, totalMaxLoan, progressPct, draftIsValid)
- Watchers only for side effects (animation triggers, etc.)

### Where the snappy reactivity lives
- Tapping a chip → ref updates → computed `draftIsValid` recomputes → button enables (instant)
- Adding an asset → push to assets array → `totalCollateral` recomputes → `progressPct` recomputes → top bar transitions via CSS (no JS animation needed)
- Removing an asset → splice → same chain → bar shrinks
- Number counter on the bar uses `requestAnimationFrame` to count from previous to new value (~400ms)

### Bundle
- Vue 3 production CDN (~35KB gzipped) — same as simple-calc
- Zero other JS dependencies
- Inline engine: ~3KB
- Inline CSS: ~6–8KB (more than simple-calc due to chip styles, list cards, progress bar, modal)
- Total page weight target: **< 60KB on the wire** (excluding Vue CDN cache hit from simple-calc)

---

## 10. Accessibility

- Sticky top bar uses `role="status"` + `aria-live="polite"` so updates are announced
- Chips are real `<button>` elements with `aria-pressed` for the selected state
- Asset cards have semantic structure (heading, list)
- Lead form fields have proper `<label>` + `aria-describedby` for errors
- Modal traps focus and is dismissible via Escape
- All animations short-circuited by `prefers-reduced-motion`
- Color contrast min AA against the orange brand

---

## 11. Embedding

Same two options as simple-calc:
1. **Inline copy** — copy the `<style>` + `<div id="boerseker-complex-calc">` + script blocks into the host page
2. **iframe** — point at the standalone page

The complex-calc has a more complex layout (sticky bar, modal), so iframe with a generous `height` attribute is the safer default for Phase 1.

---

## 12. Open Questions / Pending

| Item | Owner | Blocking? |
|---|---|---|
| Real CRM webhook URL (Zoho) | Client / dev team | No — placeholder works |
| Final Afrikaans copy review | Client | No — defaults are tone-correct per boerseker.com |
| Asset category icons (or stick with emoji) | Client / designer | No — emoji is fast and friendly |
| Exact celebration animation when goal reached | Decide during build | No |
| Should the farmer see his final number BEFORE the lead form? | **Brief says no** — gated | Resolved |
| Annexure 1 final from client (any factor changes) | Client | No — current values from existing engine.js |

---

## 13. Build Order

1. Scaffold `index.html` — head, sticky bar shell, empty content area, empty add card, empty list, gated CTA
2. Inline the engine + brand tokens + scoped reset
3. Wire `?loan=` URL param → `loanGoal` ref → top bar
4. Build the chip selectors (category, age, condition) + value input
5. Implement `addAsset()` — collateral calc, push, reset draft, update bar
6. Build asset cards in the list with delete
7. Add the "Gevorderd" disclosure with credit/term/rate fields
8. Implement progress bar fill animation + counter animation
9. Build the lead form modal + validation + submit handler (placeholder POST)
10. Build the final result screen
11. Wire up the simple-calc CTA to point at `../complex-calc/?loan=`
12. Test the full happy path on mobile width
13. Hand off for branding pass

---

## 14. Connection back to simple-calc

Two changes to `Step 1/simple-calc/index.html`:
1. Update the `data-step2-url` attribute on the mount root from `#step-2` to `../complex-calc/?loan=`
2. The `handlePrimaryClick` handler should append the current `desiredAmount` to the URL before navigation, so the goal carries over

That's the only handoff. No shared state, no postMessage, no localStorage. Stateless and embeddable.

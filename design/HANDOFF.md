# Handoff: Twentyfour mobile redesign

## Overview
A phone-native redesign of **Twentyfour**, a private, local-first time ledger: the day is shown as one living object, logging takes two taps, notes can be captured continuously during a session, and a plant grows only from substance (logged time, finished focus, reflection) — never from taps. Scope: Today, focus session, quick log, notes, Insights, Plant, Settings (incl. time zone / format / category manager), light + dark.

## About the design files
The files in this bundle are **design references created in HTML** — a prototype of the intended look and behaviour, not production code to copy. `Twentyfour Mobile.dc.html` is a single file with inline styles and mock in-memory state; it opens directly in a browser. The task is to **recreate it inside the existing Twentyfour codebase** (Vite + React + TypeScript + Tailwind, local-first store in `src/db/store.ts`), using that codebase's patterns, types and store API. Two prompts drive the work: `../claude-code-prompt.md` (data layer, do first) and `ui-port-prompt.md` (the port).

## Fidelity
**High-fidelity.** Colours, type, spacing, radii and interactions are final. Recreate pixel-close using the codebase's Tailwind + `glass-*` layer. Device chrome in the prototype (`ios-frame.jsx`) is scaffolding for presentation only — do not port it.

## Frame
Designed at **402 × 874** (iPhone 16 logical size). Content area: horizontal padding 20px, top padding 66px (status bar), bottom padding 132px (clears the tab bar). Single vertical scroll container per tab; overlays and sheets are absolute within the frame.

---

## Screens / views

### 1. App shell
- **Background:** `linear-gradient(180deg, var(--tf-scr1) 0%, var(--tf-scr2) 52%, var(--tf-scr3) 100%)` plus two radial tints (top-centre sky-blue `rgba(56,189,248,.16)`, right-middle indigo `rgba(129,140,248,.13)`), a noise overlay at `opacity: var(--tf-noise)`, and **four floating gradient blobs** (see Animations).
- **Wordmark (every screen, non-sticky, centred):** `twentyf` + ring + `ur`, Archivo 700 / 21px / letter-spacing −.045em / colour `var(--tf-ink)`; ring is 19×19px, `conic-gradient(from -90deg, …today's blocks…)` masked to a 5px band, `margin: 0 1px`. Padding `0 20px 18px`.
- **Tab bar:** absolute `left/right 12px`, `bottom 20px`, height 62, radius 23, `background: var(--tf-glass)`, `backdrop-filter: blur(26px) saturate(150%)`, 1px border `rgba(var(--tf-surf-rgb),.14)`, shadow `0 20px 44px -26px rgba(var(--tf-shadow-rgb),.95)`, inset top highlight. Grid `1fr 1fr 62px 1fr 1fr`, gap 2, padding `0 6px`.
  - Tab item: 54px tall, radius 18, icon 13px + label Archivo 600 / 9.5px; selected = 1px border `rgba(56,189,248,.45)`, `linear-gradient(135deg, rgba(56,189,248,.22), rgba(37,99,235,.12))`, colour `var(--tf-accent-ink)`; idle colour `rgba(var(--tf-ink-rgb),.55)`.
  - Centre ＋: 52×52 circle, `linear-gradient(140deg, rgba(56,189,248,.55), rgba(37,99,235,.4))`, 1px `rgba(56,189,248,.6)`, shadow `0 14px 30px -12px rgba(56,189,248,.8)` + inset highlight, glyph Archivo 300 / 26px / #fff. Opens the log sheet.
  - Order: Today · Insights · ＋ · Plant · Settings.

### 2. Today
1. **Date header** — weekday + week (mono 10px, letter-spacing .18em, uppercase, 42% ink) over date (Archivo 700 / 26px / −.02em); right side a 34px pill "local only" with a 7px `#34D399` dot.
2. **Day card** — radius 26, `linear-gradient(150deg, rgba(var(--tf-surf-rgb),.10), rgba(var(--tf-surf-rgb),.035))`, 1px `rgba(var(--tf-surf-rgb),.14)`, shadow `0 26px 54px -30px rgba(var(--tf-shadow-rgb),.95)`, inset top highlight, padding `22px 20px 18px`.
   - Eyebrow "Accounted today" (mono 10px caps, 45% ink).
   - Big figure: Archivo 800 / 58px / line-height .86 / −.045em, with the minutes part Archivo 600 / 20px at 55% ink.
   - Meta row: "`2h 12m` unaccounted" · 1px divider · "`49`% time that matters" in `var(--tf-accent-ink)`, both 13px.
   - **Day orb** (see 3).
   - **Legend** — up to 4 chips: 8px colour dot + short category name (Archivo 600 / 11px) + today's total (mono 11px), pill `rgba(var(--tf-surf-rgb),.05)` + 1px `.10`.
3. **Chronological flow card** (see 4).
4. **Running session card** (when a timer is active) — radius 24, 1px `rgba(56,189,248,.42)`, `linear-gradient(135deg, rgba(56,189,248,.24), rgba(37,99,235,.14))`, glow shadow. Eyebrow "Running now"/"Paused" in accent, activity Archivo 700 / 19px, sub line "since 7:20 pm · 2 notes this session", right side mono 300 / 34px clock. Tap → focus overlay.
5. **Two-taps grid** — 2 columns, gap 9. Each tile: radius 18, `rgba(var(--tf-surf-rgb),.045)` + 1px `.11`, padding 13, emoji 17px, name Archivo 600 / 13px, sub mono 10px ("1h 45m today" / "not yet today"). Tap → log sheet pre-filled with that activity.
6. **Ledger** — eyebrow "The ledger"; rows separated by 1px `rgba(var(--tf-surf-rgb),.07)`, padding `13px 0`: mono 11px start time (46px column), 10px category dot with `0 0 12px <color>88` glow, name Archivo 600 / 15px, category Archivo 400 / 11px at 42%, then each note as mono 9px time + Instrument Serif italic 14px at 62%, then a 28px pill `＋ 3 notes` / `＋ add a note`; duration Archivo 600 / 13px right-aligned.
7. **Empty state** — dashed 26px-radius panel: "Nothing on the ledger yet.", Instrument Serif italic 17px line, and a 46px accent pill "Log your first block".

### 3. Day orb (the dashboard chart)
- Container 296px tall, padding `14px 0`, centred; ring box 250×250.
- **Ring:** `conic-gradient(from -90deg, …)` where each block contributes two stops — `<color>f2` at `start/1440*100%` → `<color>99` at `end/1440*100%` — and gaps contribute `rgba(var(--tf-surf-rgb),.07)`. Masked with `radial-gradient(farthest-side, transparent calc(100% - 34px), #000 calc(100% - 33px))`, `filter: saturate(1.15)`, `transition: background .5s ease`.
- **Halos:** the top three categories as blurred (28px) radial discs, 240 / 206 / 172px, `<color>3a`, breathing 7 / 9.5 / 12s.
- **Sheen:** a slow (48s) rotating conic highlight `rgba(var(--tf-surf-rgb),.16)` at −6px inset, blur 6px.
- **Inner disc:** inset 42, two soft radial tints from the focused and second category.
- **Now hand:** 2×132px, transform-origin top, `rotate(now/1440*360 + 180deg)`, gradient to `rgba(var(--tf-ink-rgb),.75)`.
- **Hour ticks:** 24 (top, −20), 06 (right, −22), 12 (bottom, −20), 18 (left, −22); mono 500 / 9.5px, 55% ink, letter-spacing .06em — must sit **outside** the band.
- **Centre:** Archivo 800 / 52px figure + Archivo 600 / 12px caption ("accounted of 24 hours" or the focused category name).
- **Sentence:** Instrument Serif italic 19px at 72% — e.g. "The biggest colour today is Deep Focus & Flow, at 6h 30m. Tap the ring to walk through the rest." Focused: "Rest & Sleep took 6h 50m — that is 39% of everything you logged." Empty: "An empty ring is still a whole day."
- **Interaction:** tap cycles null → top1 → top2 → top3 → top4 → null; unfocused blocks drop to `<color>30 / <color>20`.

### 4. Chronological flow
- Card radius 26, `rgba(var(--tf-surf-rgb),.04)` + 1px `.12`, padding `18px 18px 16px`. Header: "Chronological flow" eyebrow + "newest first" / "newest first · whole day".
- **Now divider** above the newest row: mono 10px time (52px column) + 1px gradient rule + "NOW" mono 600 / 10px caps.
- **Block row:** height `clamp(34, minutes × 0.42, 112)`, radius 12, `linear-gradient(90deg, <color>2e, <color>10)`, 1px `rgba(var(--tf-surf-rgb),.08)`; selected = 1px `<color>` + `0 0 0 3px <color>22`. Contents: mono 10px start (52px), 5px full-height colour bar, name Archivo 700 / 13px, meta (mono 10px `7:00 pm–8:20 pm · Presence & Loved Ones`, shown only when height ≥44), duration mono 600 / 12px.
- **Gap row:** height 26, opacity .7, dashed 5px bar, "unaccounted" 11px, duration mono 11px. Only for gaps ≥15 min.
- **Collapse:** 4 newest rows by default; 42px button "Expand the whole day · 13 blocks" ↔ "Collapse to recent".

### 5. Focus session (overlay, z 90)
- Background `radial-gradient(600px 520px at 50% 34%, rgba(56,189,248,.2), transparent 66%)` over `linear-gradient(180deg, var(--tf-foc1), var(--tf-foc2))`; padding `80px 24px 40px`.
- Top row: "Minimise" pill (left) + status eyebrow (right).
- Ring stack 290px: breathing halo, 1px idle circle at inset 22, progress ring `conic-gradient(var(--accent) <pct>%, rgba(var(--tf-surf-rgb),.07) 0)` masked to a 5px band; centre = mono 300 / 62px clock, activity Archivo 600 / 15px, "target 25:00 · 88%" mono 11px.
- Line: Instrument Serif italic 19px — running "Nothing else is being asked of you right now.", paused "Paused time is never counted."
- **Note composer:** 48px pill input ("Note this moment…") + 48px circular ＋; Enter also submits. Notes list below, max-height 132px, scrollable: 16px-radius rows with mono 9.5px time + Instrument Serif italic 15px text. Multiple notes per session.
- Actions: "Finish · waters the plant +8" (56px, teal gradient), then "Pause"/"Resume" and "Discard" (50px, side by side).

### 6. Quick log sheet (z 80)
- Scrim `var(--tf-scrim)` + blur 3px; sheet radius `34px 34px 0 0`, `linear-gradient(180deg, var(--tf-sheet1), var(--tf-sheet2))`, 44×5 grabber, padding `14px 20px 30px`, enters with `tf-sheet` (.34s cubic-bezier(.22,1,.36,1)).
- Step 1 "What were you doing?" — 2-column activity grid, max-height 330px, scrollable; selected tile = 1px `rgba(56,189,248,.5)` + `rgba(56,189,248,.16)`.
- Step 2 "How long?" — chosen activity summary row with "Change", duration chips (15m/30m/45m/1h/1h 30m; selected = teal), optional note input, then "Save block · +12 pts" (teal) and "Start timer" (accent outline). Range reads `7:12 pm – 7:42 pm · ends now`.

### 7. Note sheet (z 85)
"Add a note", sub "Deep Flow Session · notes stack up on a block", 52px input, "Save note" + "Cancel". Enter submits. Appends to that block's notes.

### 8. Insights
Header + "All charts keyed to New York · 12-hour". Then: score card (104px conic ring, hole `var(--tf-card-solid)`, Archivo 800 / 27px percentage, "MATTERS" mono 9px; headline Archivo 700 / 17px + priorities line); "Where the week went" bars (name 14px + mono duration, 9px track, `linear-gradient(90deg, <color>, <color>77)`); "Seven days" stacked columns (132px tall, today outlined); closeout card with Instrument Serif italic 19px quote + 5 mood dots. Empty state: faded skeleton bars, "Insights arrive after three logged days."

### 9. Plant
330px sky card (radius 30, `linear-gradient(180deg, var(--tf-sky1), var(--tf-sky2) 46%, var(--tf-sky3))`), 14 stars at `var(--tf-star)`, breathing halo, ground glow, plant built from a 7px stem (height by stage), leaves (`46−2i × 20`, `border-radius: 100% 0 100% 0`, alternating ±22°, `linear-gradient(135deg,#7CE3A1,#2F8C5A)`), canopy disc from stage 4, soil ellipse; `tf-sway` 4.2s. Overlays: "Day 26 · late summer" + stage name (Archivo 700 / 27px) top-left, haiku (Instrument Serif italic 17px) bottom. Below: "Toward Maturing Tree" + "28 pts to go", 11px growth bar (`linear-gradient(90deg,#7FD3C2,#34D399)`), the earned-not-tapped explainer, then the water log rows (8px teal dot, label 14px, mono time, `+9` in teal). Tapping the plant only nudges it: toast "It sways, politely / Growth comes from logged time — not taps."

### 10. Settings
Header + "This device only". Toggle rows (Light mode, Chimes, Haptics, Week starts Monday): 20px-radius row, name 14px + hint 11px, 48×29 track (on = accent gradient) with a 23px white knob, `left` transition .18s. Then **Time format** card (12-hour / 24-hour chips, current time shown), **Time zone** card (New York default, Los Angeles, London, Berlin, Tokyo; radio mark = 16px circle with 5px accent border; note "Day boundaries and midnight splits follow this zone."), **Default focus length** (15/25/45/90 chips), **Categories** (header + "＋ New"; rows: 30px gradient swatch with emoji, name, "flexible · 1h 45m today", chevron), **Your data** (JSON backup, CSV export, restore, reset — reset styled danger), and the closing Instrument Serif line "Nothing leaves this phone…".

### 11. Category editor sheet (z 86)
"New category" / "Edit category" + Close. Live preview row (`linear-gradient(90deg, <color>2e, transparent)`, 1px `<color>66`) with emoji + name. Emoji input (62px, centred) + name input. Colour: 10 swatches 38px / radius 13 (`#818CF8 #38BDF8 #34D399 #F59E0B #60A5FA #A78BFA #FB7185 #94A3B8 #7FD3C2 #F4A6D8`), selected = 2px `var(--tf-ink)` + `0 0 0 3px <color>55`. Kind chips: flexible / fixed / rest. "Save category" (teal) + "Delete" (danger, edit only). Creating a category also creates a same-named activity so it is immediately loggable.

### 12. Toast
Absolute `left/right 16px`, `bottom 112px`, radius 20, `var(--tf-glass-strong)` + blur 20, 1px `rgba(127,211,194,.45)`; 30px teal orb, title Archivo 600 / 14px, sub 11px; auto-dismiss 3.6s; enters with `tf-rise`.

---

## Interactions & behaviour
- **Two-tap log:** ＋ (or a favourite tile) → activity → duration → Save. Block ends "now"; growth points are shown before committing (`round(min(minutes × 0.4, 16))`, min 1).
- **Session:** start from the log sheet → focus overlay; timer ticks 1s; pause excludes paused time; notes append with the current time; Finish creates the block with all notes and waters the plant (`6 + round(min(minutes × 0.08, 6))`); Discard writes nothing.
- **Orb:** tap cycles category focus (see 3).
- **Flow:** tap selects a block; expand/collapse toggles the whole day.
- **Zone/format:** every timestamp and the whole day-keying (including midnight re-splitting and the date header) follow the setting. Defaults **12-hour** and **America/New_York**.
- **Theme:** toggle in Settings (and the prototype's rail); device status bar/home indicator must follow it.
- **Animations:** `tf-float-a` 26s / `tf-float-b` 34s blobs; `tf-breathe` 6s halos; `tf-sway` 4.2s plant; `tf-rise` .5s toast; `tf-sheet` .34s sheets; orb sheen 48s linear; all disabled under `prefers-reduced-motion`.
- **Empty states:** Today, Insights and Plant each have one (see above); the flow card hides entirely.

## State
`tab`, `theme`, `entries[]` (each with `notes[]`), `timer {activityId, startMin, elapsedSec, paused, notes[]}`, `sessionNotes[]`, `noteDraft`, `noteTarget`, `orbFocus`, `flowExpanded`, `picked` (flow selection), `logOpen/logAct/logDur`, `cats{}`, `acts[]`, `catEditor`, `water[]`, `points`, `todayPoints`, `hour12`, `tz`, `sound`, `haptics`, `weekMonday`, `focusLen`, `toast`. In the real app all persistent slices come from `src/db/store.ts`; only UI-transient state (drafts, sheets, orb focus, expansion) stays in components.

## Design tokens

**Custom properties — dark / light**

| Token | Dark | Light |
|---|---|---|
| `--tf-ink-rgb` | `241,245,249` | `28,36,54` |
| `--tf-ink` | `#F1F5F9` | `#1C2436` |
| `--tf-surf-rgb` | `255,255,255` | `32,52,88` |
| `--tf-shadow-rgb` | `0,0,0` | `130,148,178` |
| `--tf-accent-ink` | `#7dd3fc` | `#0e7490` |
| `--tf-accent2-ink` | `#a8e5da` | `#0f766e` |
| `--tf-danger` | `#f0a9a6` | `#b4534f` |
| `--tf-page` | `#0a0d14` | `#eef1f8` |
| `--tf-card-solid` | `#0a0e17` | `#ffffff` |
| `--tf-scr1/2/3` | `#0b1120 / #080b12 / #05070b` | `#fbfcff / #f4f7fd / #eef2fa` |
| `--tf-sky1/2/3` | `#101a2e / #0b1220 / #070a11` | `#dce9fb / #e9f1fd / #f5f9ff` |
| `--tf-sheet1/2` | `#131c2e / #0a0e18` | `#ffffff / #f3f7fd` |
| `--tf-foc1/2` | `#080d18 / #04060b` | `#eaf2fb / #f8fbff` |
| `--tf-glass` | `rgba(14,20,33,.84)` | `rgba(255,255,255,.82)` |
| `--tf-glass-strong` | `rgba(16,24,38,.94)` | `rgba(255,255,255,.95)` |
| `--tf-scrim` | `rgba(4,7,14,.66)` | `rgba(28,40,64,.32)` |
| `--tf-star` | `#fff` | `rgba(120,150,200,.35)` |
| `--tf-noise` | `.5` | `.16` |
| `--tf-b1..b4` (blobs) | `rgba(56,189,248,.34) / rgba(129,140,248,.30) / rgba(52,211,153,.24) / rgba(244,166,216,.18)` | `rgba(125,211,252,.50) / rgba(165,180,252,.44) / rgba(134,239,197,.38) / rgba(249,196,226,.34)` |

**Category colours** (from the repo's defaults): Rest & Sleep `#818CF8` · Deep Focus & Flow `#38BDF8` · Presence & Loved Ones `#34D399` · Movement & Vitality `#F59E0B` · Reading & Wisdom `#60A5FA` · Leisure & Unwind `#A78BFA` · Social & Feeds `#FB7185` · Chores & Upkeep `#94A3B8`. Accent for rings/controls: `#38BDF8` (tweakable; teal `#7FD3C2` is the alternate). Positive/growth: `#7FD3C2 → #34D399`. Danger: `rgba(213,108,104,…)`.

**Typography** — Archivo 400/500/600/700/800 (UI, numerals), Instrument Serif regular + italic (reflective copy, notes, haiku), JetBrains Mono 300/400/500 (times, eyebrows, metadata). Display figures use −.045em tracking; eyebrows use mono 10px with .18em tracking, uppercase.

**Spacing** — screen padding 20; card padding 18–22; section gaps 18–20; row gaps 8–11; grid gaps 9.
**Radii** — 12 (flow rows) · 14 (expand) · 18–20 (rows, inputs) · 23 (tab bar) · 24–26 (cards) · 30 (plant) · 34 (sheets) · 999 (pills).
**Shadows** — cards `0 26px 54px -30px rgba(var(--tf-shadow-rgb),.95)`; tab bar `0 20px 44px -26px …`; sheets `0 -24px 60px -20px …`; accent glow `0 14px 30px -12px rgba(56,189,248,.8)`.

## Assets
No image assets. Emoji are the category glyphs (from the repo's defaults). Icons are text glyphs (◔ ◫ ❧ ⚙ ＋ ›). The plant, orb and stars are CSS gradients/shapes — no SVG artwork. Fonts come from Google Fonts in the prototype; vendor them as woff2 for the PWA. Wordmark: see `Twentyfour Logo.dc.html` (option **1b**, "one word, tight — the day ring as counter", is the chosen mark).

## Files in this bundle
- `Twentyfour Mobile.dc.html` — the full prototype (open in a browser). `support.js` and `ios-frame.jsx` must sit beside it.
- `Twentyfour Logo.dc.html` — wordmark and app-icon options; 1b is chosen.
- `ui-port-prompt.md` — prompt 2: the UI port task.
- `claude-code-prompt.md` — prompt 1: the data layer (v4 schema, notes, zone/format, category CRUD). **Do this first.**
- `screenshots/` — reference states. `01–12-state.png`: Today top, Today mid, Today ledger, flow expanded, Insights top, Insights lower, Plant top, Plant lower, Settings top, Settings categories, category editor, back to Today. `01–12-b-state.png`: focus overlay, focus with a note typed, log sheet, log sheet duration step, note sheet, light mode Today, light mode mid, light mode Plant, first-run Today, first-run Insights, first-run Plant, seeded/dark again.

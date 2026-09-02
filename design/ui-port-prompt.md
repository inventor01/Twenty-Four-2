# Prompt 2 for Claude Code — port the Twentyfour mobile design into the app

Run this AFTER the data-layer task (`claude-code-prompt.md`) is merged and green. Working directory: the `Twentyfour` repo root, with `design/Twentyfour Mobile.dc.html` (+ `support.js`, `ios-frame.jsx`) and `screenshots/` from this handoff folder available.

---

You are porting a finished mobile design into the existing `Twentyfour` PWA (Vite + React + TypeScript + Tailwind, local-first store in `src/db/store.ts`). The design lives in `design/Twentyfour Mobile.dc.html` — open it in a browser and read its source. It is a **design reference**, not production code: it is one HTML file with inline styles and a mock in-memory state. Do not copy it wholesale. Recreate it as React components in this repo, using the repo's existing patterns (Tailwind classes, the `glass-*` utility layer in `src/index.css`, the real store API, the existing types).

Read `HANDOFF.md` in this folder first — it specifies every screen, component, token, interaction and state. It is the source of truth for measurements and copy. Where the design and the repo disagree, the design wins for UI and the repo wins for data.

## Scope, in order

1. **Theme layer.** Replace the current ad-hoc dark/light handling with the design's CSS custom properties (full list in `HANDOFF.md` → Design Tokens). Define them once on the app shell under `[data-theme="dark"|"light"]`, keep `themeEngine`'s persistence, and drive every surface from the variables. Add the four drifting gradient blobs (`.tf-blob`, `tf-float-a/b` keyframes) behind the app shell and honour `prefers-reduced-motion`.

2. **App shell + navigation.** Bottom tab bar of five slots — Today, Insights, centred ＋ (opens the log sheet), Plant, Settings — 62px tall, 23px radius, translucent, `safe-area-inset-bottom`. Centre the wordmark (`twentyf◍ur`, the ring is a live conic gradient of today's blocks) at the top of every screen, scrolling with content, not sticky. Retire the old sticky top nav.

3. **The day orb** (replaces `DayBalanceCard`'s bar). A 250px conic-gradient ring in real time-of-day order (0–1440 min → 0–360°, starting at −90°), 34px band via a radial mask, three drifting category halos behind it, a now-hand, hour ticks at 24/06/12/18 outside the band, big accounted hours in the centre, and one plain-language sentence beneath. Tapping cycles focus through the top four categories: the focused category stays saturated, the rest drop to ~12% alpha, and the centre + sentence switch to that category's totals.

4. **Chronological flow** (replaces `DayTimelineBar`). Newest-first list of the day's blocks; row height ∝ duration, clamped 34–112px; dashed "unaccounted" rows for gaps ≥15 min; a now divider above the newest row; collapsed to the 4 newest with an expand/collapse control that reveals the whole day.

5. **Ledger with notes** (replaces `TimelineEntries`). Each block shows start time, category dot, activity name, category, its notes (timestamp + serif italic text), duration, and a `＋ n notes / add a note` pill opening the note sheet. Wire to `addNoteToEntry`.

6. **Focus session.** Full-screen overlay: breathing halo, progress ring against the target, mono elapsed clock, activity name, a note composer that appends a timestamped note to the *running timer* (Enter or ＋, multiple notes per session, listed newest-last, scrollable), Finish (shows the growth points it will earn), Pause (paused time never counted), Discard. Notes flush onto the created entry on finish; discard drops them.

7. **Quick log sheet.** Two steps in one sheet: activity grid → duration chips (15/30/45/60/90) with an optional note field, "Save block · +n pts" and "Start timer" as alternatives. Ends-now semantics.

8. **Settings.** Toggles (light mode, chimes, haptics, week starts Monday), time format (12/24, default 12), time zone list (default `America/New_York`), default focus length, **category manager** (list → editor sheet with emoji, name, 10-swatch colour palette, kind, save, delete) wired to the new CRUD API, and the data rows (JSON backup, CSV export, restore, reset) wired to the existing export/import functions.

9. **Insights & Plant.** Keep the existing computations from `src/analytics/ledger.ts`; restyle to the design: score ring, category bars, seven-day stacked columns, closeout quote card; plant card with sky, halo, sway, stage name + haiku, growth bar, water log — all timestamps in the chosen zone/format.

## Rules

- Every timestamp in the UI goes through the settings-aware formatter from prompt 1. No `toLocaleTimeString` sprinkled in components.
- No new dependencies. No inline `<style>` blobs in components — Tailwind + the shared CSS variable layer.
- Touch targets ≥44px. Text ≥11px only for mono metadata; body copy ≥13px.
- Fonts: Archivo (UI), Instrument Serif (reflective copy/notes), JetBrains Mono (times, metadata). Self-host or use the existing font pipeline; do not add a runtime font CDN dependency to the PWA shell if it breaks offline — vendor the woff2s.
- Keep `RunningTimerCard`, `QuickAddModal` etc. as files where sensible; rewrite their contents rather than adding parallel components.
- Delete what the design retires (old nav, `DayTimelineBar` internals) instead of leaving dead code.

## Definition of done

- Both themes correct on every screen, including the iOS status bar area and safe insets.
- A session can capture several notes, survive a reload mid-session, and land them on the finished block.
- Changing zone re-keys the orb, flow, ledger, insights and water log consistently; changing format changes every clock.
- Creating a category makes it immediately loggable; deleting one behaves per the chosen strategy; colour changes propagate to orb, flow, ledger and insights.
- First-run/empty states render for Today, Insights and Plant.
- `npm run lint && npm test && npm run build` pass; add component tests for the orb geometry (angles from minutes) and the flow row heights.
- Finish with a summary of files added/changed and anything from `HANDOFF.md` you deliberately deviated from, and why.

Work screen by screen, committing per numbered section above.

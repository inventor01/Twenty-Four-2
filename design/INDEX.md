# design/

Design handoff for the Twentyfour mobile redesign. Reference material only — nothing in this folder ships or gets imported by the app.

## Contents

| Path | What it is |
|---|---|
| `README.md` | Entry point for the handoff — read order, decisions to confirm, definition of done |
| `HANDOFF.md` | The full spec: every screen, component, measurement, token, interaction, state |
| `claude-code-prompt.md` | Prompt 1 — data layer (v4 schema, multi-note entries, time zone + format, category CRUD). Do first. |
| `ui-port-prompt.md` | Prompt 2 — port the design into the app's components |
| `Twentyfour Mobile.dc.html` | Working prototype. Open in a browser; keep `support.js` and `ios-frame.jsx` beside it. |
| `Twentyfour Logo.dc.html` | Wordmark options. Variant **1b** ("twentyf◍ur", ring is a live gradient of today's blocks) is the chosen mark. |
| `support.js`, `ios-frame.jsx` | Prototype scaffolding. `ios-frame.jsx` is device chrome for presentation — do **not** port it. |
| `screenshots/` | 24 reference states — `NN-state.png` and `NN-b-state.png` |

## Important

The `.dc.html` files are **design references, not production code**. They are single-file, inline-styled, with mock in-memory state. The redesign is recreated inside the existing app (Vite + React + TypeScript + Tailwind, local-first store in `src/db/store.ts`) using that codebase's patterns, types, and store API.

Frame is 402 × 874 (iPhone 16 logical). Fidelity is high — colours, type, spacing, radii, and interactions are final.

## Open decisions

Carried over from `README.md`, still unresolved:

- Does the ledger day follow the chosen time zone or the device zone? (Design assumes chosen zone.)
- Deleting a category: drop its blocks, or force reassignment? (Prototype drops them.)
- Do notes appear in the CSV export?
- Is 12-hour the default for everyone, or locale-derived? (Design defaults to 12-hour, New York.)
- Keep the existing plant point rules, or the prototype's (`log = round(min(min×0.4,16))`, `focus = 6 + round(min(min×0.08,6))`, daily cap 18)?

# Twentyfour mobile — design handoff

Everything Claude Code needs to build the redesigned app.

## Read in this order
1. **`HANDOFF.md`** — the spec: every screen, component, measurement, token, interaction and state.
2. **`claude-code-prompt.md`** — prompt 1: the data layer (v4 schema, multi-note entries, time zone + format, category CRUD). **Do this first.**
3. **`ui-port-prompt.md`** — prompt 2: port the design into the app's components.

## The design
`Twentyfour Mobile.dc.html` is the working prototype — open it in a browser (keep `support.js` and `ios-frame.jsx` beside it). It is a **design reference**, not production code: one file, inline styles, mock in-memory state. Recreate it inside the existing Twentyfour repo with that repo's patterns, types and store API.

`Twentyfour Logo.dc.html` holds the wordmark options; **1b** ("twentyf◍ur", the ring is a live gradient of today's blocks) is the chosen mark and is already in the prototype header.

## Screenshots
`screenshots/NN-state.png` — Today top · Today mid · Today ledger · flow expanded · Insights top · Insights lower · Plant top · Plant lower · Settings top · Settings categories · category editor · Today again.

`screenshots/NN-b-state.png` — focus overlay · focus with a note typed · log sheet · log duration step · note sheet · light-mode Today · light-mode mid · light-mode Plant · first-run Today · first-run Insights · first-run Plant · seeded dark again.

## Decisions to confirm before coding
- Does the ledger day follow the chosen time zone or the device zone? (Design assumes the chosen zone.)
- Deleting a category: drop its blocks, or force reassignment? (Prototype drops them.)
- Do notes appear in the CSV export?
- Is 12-hour the default for everyone, or locale-derived? (Design defaults to 12-hour, New York.)
- Keep the existing plant point rules, or the prototype's (`log = round(min(min×0.4,16))`, `focus = 6 + round(min(min×0.08,6))`, daily cap 18)?

## Done means
`npm run lint && npm test && npm run build` pass; both themes correct on every screen; a session can hold several notes and survive reload; zone/format changes re-key every chart and clock; a new category is immediately loggable.

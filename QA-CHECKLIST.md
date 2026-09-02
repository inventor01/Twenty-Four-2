# Twentyfour — UI/UX QA checklist

Run top to bottom. Anything that fails, note the screen + step.

## 0. Build gates (must pass before manual testing)

```bash
npm install
npm run lint      # tsc --noEmit
npm run build
npm test
npm run dev
```

None of these have been run in this environment — no network to install dependencies. Treat a green run here as the first real verification.

---

## 1. Scroll behaviour

The most common source of "stuck" or "weird" scrolling. Test on a short day (0–1 entries) and a long day (15+ entries).

- [ ] Today scrolls smoothly top to bottom; no rubber-banding that snaps back
- [ ] The last ledger row is fully readable and **not** hidden behind the tab bar
- [ ] Tab bar stays pinned at the bottom of the **viewport** while scrolling — it must not scroll away with content
- [ ] No horizontal scroll on any screen (swipe left/right — page should not move)
- [ ] No phantom empty space below the last element
- [ ] Insights, Plant, Settings each scroll independently and land at top when switched to
- [ ] Switching tabs mid-scroll doesn't leave the next tab scrolled to a strange offset
- [ ] With a sheet open, the background does **not** scroll behind it
- [ ] Closing a sheet returns you to the same scroll position, not the top
- [ ] Page doesn't shift horizontally when a sheet opens (scrollbar compensation)

## 2. Overlap / layering

Open each overlay and confirm nothing from the layer below pokes through.

- [ ] Log sheet (＋) covers the tab bar completely — no tabs or ＋ visible on top of it
- [ ] Note sheet covers the tab bar
- [ ] Date picker covers the tab bar
- [ ] Category editor covers the tab bar
- [ ] Auth modal covers the tab bar
- [ ] Onboarding modal covers everything
- [ ] Focus overlay covers the tab bar and the running-session bar
- [ ] Ledger entry editor sits above the ledger sheet it was opened from
- [ ] Toast appears above all sheets and is visible even when scrolled to the bottom
- [ ] Two sheets can't be open at once (e.g. date picker while log sheet is open)

## 3. Safe area / device chrome

Test on a notched device or simulator, both orientations if supported.

- [ ] Wordmark isn't under the status bar / notch
- [ ] Tab bar clears the home indicator on iPhone
- [ ] Focus overlay content isn't clipped at top or bottom
- [ ] Sheets sit flush to the bottom edge with no gap below them

## 4. Tap targets and interaction

- [ ] All five tab bar targets are tappable across their full height (54px)
- [ ] Centre ＋ is tappable and opens the log sheet
- [ ] Tapping the wordmark returns to Today
- [ ] Two-tap tiles open the log sheet pre-filled with that activity
- [ ] Ledger "＋ add a note" pill opens the note sheet for the right entry
- [ ] Nothing is tappable *through* a scrim (tap the dimmed background — only "close" should happen)
- [ ] Rapid double-tap on ＋ doesn't open two stacked sheets

## 5. State and data edges

- [ ] **Empty day**: dashed empty-state panel shows, no broken layout, wordmark ring renders neutral
- [ ] **First run**: onboarding appears, completes, doesn't reappear on reload
- [ ] **Long activity name** (40+ chars): truncates with ellipsis, doesn't wrap the row or overflow
- [ ] **Many categories** (10+): legend caps at 4 chips, category list scrolls
- [ ] **Long day** (15+ entries): ledger renders, orb slices don't overlap incorrectly
- [ ] **Running timer**: session bar appears; tapping opens focus overlay; clock ticks
- [ ] Reload mid-session: timer survives and shows correct elapsed time
- [ ] Notes added during a session persist after reload

## 6. Theme

**Light is now the default.** Test light first, then toggle.

- [ ] App opens in light mode on a fresh load, with no dark flash before paint
- [ ] Accent buttons (＋, Save, Log) have readable text — light mode uses white on dark teal
- [ ] Card surfaces and borders are visible in light mode (not white-on-white)
- [ ] Colour-swatch selection ring is visible in light mode
- [ ] Auth and Onboarding modals still render dark — this is intentional, confirm it looks acceptable
- [ ] Light mode: every screen readable, no white-on-white or black-on-black
- [ ] Dark mode: same
- [ ] Toggling theme doesn't require reload and doesn't flash
- [ ] Tab bar selected state visible in both themes
- [ ] Blobs and noise overlay don't wash out text in light mode

## 7. Time zone / format

- [ ] Changing time zone re-keys the ledger, charts, and clocks
- [ ] Switching 12h ↔ 24h updates every timestamp
- [ ] An entry near midnight lands on the correct day
- [ ] Day boundary matches the **chosen** zone, not the device zone

> This is still an open decision in `design/INDEX.md`. Confirm the intended behaviour before treating a mismatch as a bug.

## 8. Auth (Google)

- [ ] "Sign in with Google" opens the popup and completes
- [ ] Popup blocked → error message shown, app not left in a loading state
- [ ] Cancelling the popup returns cleanly, no spinner stuck
- [ ] First sign-in creates a user doc in Firestore
- [ ] Second sign-in does **not** overwrite existing profile fields
- [ ] Sign out clears profile and returns to signed-out state
- [ ] Email sign-up with <6 char password shows the validation error
- [ ] Offline: app still loads and logs locally (local-first), no crash

> Sign-in is reachable from **Settings**. The header pill was removed to match the design.

## 9. Accessibility

- [ ] Keyboard: Tab reaches all controls; focus ring visible
- [ ] Escape closes the topmost sheet
- [ ] `prefers-reduced-motion` on: blobs, orb spin, and pulse animations stop
- [ ] Text contrast passes in both themes
- [ ] Screen reader announces tab changes

## 10. Console

- [ ] No red errors in DevTools console on any screen
- [ ] No React key warnings when rendering ledger rows or category lists
- [ ] No "Cannot update state on unmounted component" warnings after closing sheets
- [ ] No Firebase permission-denied errors when signed in

---

## Fixed in this pass

These were found and corrected during the audit — re-verify them specifically:

| Issue | Was | Now |
|---|---|---|
| Tab bar scrolled away with content | `absolute` inside a `min-h-screen` frame | `fixed` to viewport, safe-area aware |
| Tab bar rendered on top of every sheet | tab bar `z-60`, sheets `z-50` | sheets raised to `z-80`, focus `z-90` |
| Background blobs added phantom scroll height | blobs `absolute` in the growing frame | moved to a `fixed`, clipped, `pointer-events-none` layer |
| Background scrolled behind open sheets | no scroll lock | `body` scroll locked while any overlay is open, with scrollbar-gap compensation |
| Toast scrolled off-screen | `absolute top-16` on the tall frame | `fixed`, `z-130`, centred |
| Running-session bar stuck to a removed header | `sticky top-[58px]` | `sticky top-2` |
| Focus overlay wider than the frame | `max-w-md` (448px) | `max-w-[402px]` |

## Known remaining gaps

- Today's date header still uses ◀/▶ arrows rather than the spec's weekday-over-date layout with the "local only" pill.
- Screen interiors (ledger rows, Insights, Plant) have not been audited measurement-by-measurement against `design/HANDOFF.md`.
- Ledger time-zone semantics unresolved — see `design/INDEX.md`.

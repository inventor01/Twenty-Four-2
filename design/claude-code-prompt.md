# Prompt for Claude Code — Twentyfour data layer (v4)

Copy everything below the line into Claude Code, run from the root of the `Twentyfour` repo with the design prototype (`Twentyfour Mobile.dc.html`) in the same folder.

---

You are working in the `Twentyfour` repo: a local-first, private time-ledger PWA (Vite + React + TypeScript, Zod validation, localStorage for fast reads mirrored to IndexedDB for durability, Vitest for tests). Read these first before writing code:

- `src/types.ts`, `src/db/schema.ts`, `src/db/store.ts`, `src/db/indexedDb.ts`
- `src/lib/time.ts`, `src/timer/engine.ts`, `src/analytics/ledger.ts`
- the existing tests: `src/db/schema.test.ts`, `src/lib/time.test.ts`, `src/timer/engine.test.ts`, `src/analytics/ledger.test.ts`

**Task: extend the persistence layer to schema version 4 so it supports four capabilities the new design needs.** Do NOT touch the UI in this task — data layer, schema, migrations, store API and tests only. Keep the app local-first: no network calls, no accounts, no external database.

## 1. Multiple notes per time entry

Today `TimeEntry.note?: string` holds one note. The new design captures notes *continuously during a running session* (one session → many timestamped notes) and also allows adding notes to any past block.

- Add `EntryNote { id: string; text: string; createdAtMs: number }` and `TimeEntry.notes: EntryNote[]`.
- Keep `note?: string` readable for one release: migration moves a non-empty `note` into `notes[0]` (with `createdAtMs = endedAtMs`) and then stops writing `note`.
- Notes captured while a timer runs must survive reload: add `TimerState.notes: EntryNote[]`, persisted with the timer, flushed onto the created `TimeEntry` when the timer is finished, and dropped when it is discarded.
- Store API: `addNoteToEntry(entryId, text)`, `updateNote(entryId, noteId, text)`, `deleteNote(entryId, noteId)`, `addTimerNote(text)`.
- Cap notes at 50 per entry and 1000 chars each; validate in Zod.

## 2. Time zone + time format settings

The ledger currently keys days off the device's local time. The design lets the user choose a zone (default `America/New_York`) and a clock format (default 12-hour).

- `UserSettings.timeZone: string` (IANA id, default `'America/New_York'`) and `UserSettings.hourFormat: 12 | 24` (default `12`).
- Rework `src/lib/time.ts` so every day-keying function takes the zone into account — `localDateKey`, day-boundary/midnight splitting, week bucketing — using `Intl.DateTimeFormat` with `timeZone` (no new dependency). Entries stay stored as absolute epoch ms; only `localDate` derivation and display change.
- Add `formatClock(ms, settings)` returning `7:42 pm` or `19:42`.
- Changing the zone must re-derive `localDate` for all existing entries (and re-split overnight blocks at the new midnight) in a single transaction, then notify subscribers. Write this as an explicit `recomputeLocalDates(zone)` in the store.
- Tests: an entry spanning midnight splits correctly in `America/New_York`, in `Asia/Tokyo`, and across a DST transition (pick a real US spring-forward date).

## 3. Category and activity CRUD

The design has a full category editor: create, rename, recolour, change emoji, change kind (`fixed | flexible | rest`), delete.

- Store API: `createCategory(input)`, `updateCategory(id, patch)`, `deleteCategory(id, strategy)` where `strategy` is `{ mode: 'reassign', toCategoryId } | { mode: 'delete-entries' }` — never orphan entries or activities. Return a summary of what changed.
- Creating a category also creates one default activity in it (same name) so it is immediately loggable.
- Renaming a category must update the denormalised `categoryName` / `categoryColor` / `emoji` snapshots stored on existing `TimeEntry` rows (the app relies on them for analytics), and the same for activity renames and `activityName`.
- Protect referential integrity: deleting a category referenced by a `Budget` deletes or reassigns that budget per the same strategy; `priorityCategoryIds` in settings is cleaned up.
- Tests: delete-with-reassign keeps total logged minutes constant; delete-with-entries removes exactly that category's minutes; rename propagates to entry snapshots and budgets.

## 4. Migration + backup/restore

- Bump `DataEnvelope.version` to `4` and add a versioned migration chain (`3 → 4`, and keep the existing `twentyfour_v2 → 3` path working). Migrations must be pure functions over the parsed envelope, unit-tested, and idempotent.
- Extend the Zod `backupSchema` for the new fields with sane defaults so older backups import cleanly; unknown future fields must not throw.
- Keep JSON backup/restore and CSV export working: CSV gains a `notes` column (notes joined with ` | `) and uses the settings' zone/format for its timestamp columns.
- Verify the IndexedDB mirror writes the new shape and that a cold start with only IndexedDB data (localStorage cleared) restores everything, including running-timer notes.

## Constraints and definition of done

- No new runtime dependencies. TypeScript strict, no `any` in the store's public API.
- Every store mutation stays synchronous for callers, mirrored to IndexedDB asynchronously, and notifies `subscribeToStore`.
- `npm run lint`, `npm test`, `npm run build` all pass. Add tests for each of the four areas above (aim for the store's public API, not internals).
- Update `README.md` "Core behavior" and `CHANGELOG.md` with a v4 entry describing the schema change and the migration.
- Finish with a short summary of: new/changed types, new store functions, the migration path, and anything the UI will need to call to use these features.

Work in small commits, one capability per commit, tests alongside.

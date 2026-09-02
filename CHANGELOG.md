# Twentyfour 1.1.0

## Mobile redesign

- Rebuilt the app around the supplied phone-native Twentyfour design: 24-hour orb, chronological flow, two-tap favorites, fixed glass navigation, Focus overlay, Insights, Plant, Settings, onboarding, and optional account sync.
- Preserved the stylized living plant, calm motion, light/dark themes, and frosted solid glass treatment.

## Ledger controls

- Added touch-safe hold-to-edit with activity and category editing plus single-entry deletion.
- Added multi-select, select-all, atomic bulk deletion, category filtering, and newest/oldest/longest/shortest sorting.
- Added keyboard and visible menu-button access to the same editor for desktop and accessibility.

## Focus timer fixes

- Fixed the minimized timer disappearing from Today by showing the live timer bar on every tab until the timer is finished or discarded.
- Kept pause state, elapsed time, target duration, and focus notes in the persistent timer store across minimize/reopen and tab changes.
- Removed oversized vertical spacing and made Focus responsive to short mobile viewports.

# Twentyfour 1.0.0

## Product and interface

- Reordered Today around the running timer, daily ledger, useful insight, 24-hour timeline, activities, plant, and detailed entries.
- Added clear navigation labels and a mobile bottom tab bar; moved Settings into the header.
- Added first-run priority onboarding and a transparent Time That Matters score.
- Added a compact plant companion to Today and a full Plant sanctuary view.
- Rebuilt panels as readable Apple-style frosted solids in light and dark modes.
- Refined the SVG plant with a clear stem, layered leaf clusters, soft depth, 3.6-second idle sway, and short growth/water reactions.

## Correctness and durability

- Excluded every pause interval from finished timer entries.
- Split running, manual, and sleep entries at local midnight with DST-safe day bounds.
- Blocked overlapping manual entries and merged imported overlaps in tracked-time totals.
- Fixed weekly budget windows and category-ID matching.
- Replaced hardcoded priority names with onboarding selections.
- Removed fake seed history and tap-to-grow behavior.
- Added IndexedDB mirroring, validated backups, strict TypeScript, PWA metadata, and regression tests.

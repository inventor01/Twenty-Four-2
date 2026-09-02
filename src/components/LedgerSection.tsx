import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Category, TimeEntry } from '../types';
import { fmtTime12, fmtTime24 } from '../lib/time';

type LedgerSort = 'newest' | 'oldest' | 'longest' | 'shortest';

interface LedgerSectionProps {
  entries?: TimeEntry[];
  categories?: Category[];
  activities?: Activity[];
  selectedDateKey?: string;
  hourFormat?: 12 | 24;
  timeZone?: string;
  onAddNote?: (entry: TimeEntry) => void;
  onOpenLogModal?: () => void;
  onUpdateEntry?: (entry: TimeEntry) => void;
  onDeleteEntries?: (ids: string[]) => void;
}

export const LedgerSection: React.FC<LedgerSectionProps> = ({
  entries = [],
  categories = [],
  activities = [],
  hourFormat = 12,
  timeZone,
  onAddNote,
  onOpenLogModal,
  onUpdateEntry,
  onDeleteEntries,
}) => {
  const [sortBy, setSortBy] = useState<LedgerSort>('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [draftActivityName, setDraftActivityName] = useState('');
  const [draftCategoryName, setDraftCategoryName] = useState('');
  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef({ x: 0, y: 0 });
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const validIds = new Set(entries.map((entry) => entry.id));
    setSelectedIds((current) => new Set([...current].filter((id) => validIds.has(id))));
  }, [entries]);

  const formatTimeParts = (ms: number): { time: string; period: string } => {
    const formatted = hourFormat === 24 ? fmtTime24(ms, timeZone) : fmtTime12(ms, timeZone);
    if (hourFormat === 12) {
      const match = formatted.match(/^(\d+:\d+)\s*(am|pm)$/i);
      if (match) return { time: match[1], period: match[2].toLowerCase() };
    }
    return { time: formatted, period: '' };
  };

  const formatNoteTime = (ms: number): string =>
    hourFormat === 24 ? fmtTime24(ms, timeZone) : fmtTime12(ms, timeZone);

  const availableCategoryNames = useMemo(() => {
    const names = new Set(categories.map((category) => category.name));
    entries.forEach((entry) => names.add(entry.categoryName));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [categories, entries]);

  const visibleEntries = useMemo(() => {
    const filtered = categoryFilter === 'all'
      ? [...entries]
      : entries.filter((entry) => entry.categoryName === categoryFilter);

    return filtered.sort((a, b) => {
      if (sortBy === 'oldest') return a.startedAtMs - b.startedAtMs;
      if (sortBy === 'longest') return b.durationSec - a.durationSec;
      if (sortBy === 'shortest') return a.durationSec - b.durationSec;
      return b.startedAtMs - a.startedAtMs;
    });
  }, [categoryFilter, entries, sortBy]);

  const clearHold = () => {
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  };

  const openEditor = (entry: TimeEntry) => {
    clearHold();
    suppressClickRef.current = true;
    setEditingEntry(entry);
    setDraftActivityName(entry.activityName);
    setDraftCategoryName(entry.categoryName);
  };

  const beginHold = (event: React.PointerEvent, entry: TimeEntry) => {
    if (selectMode || event.button !== 0) return;
    holdStartRef.current = { x: event.clientX, y: event.clientY };
    suppressClickRef.current = false;
    clearHold();
    holdTimerRef.current = window.setTimeout(() => openEditor(entry), 520);
  };

  const moveHold = (event: React.PointerEvent) => {
    const distance = Math.hypot(
      event.clientX - holdStartRef.current.x,
      event.clientY - holdStartRef.current.y,
    );
    if (distance > 10) clearHold();
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    if (!onDeleteEntries || selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected ${selectedIds.size === 1 ? 'entry' : 'entries'}?`)) return;
    onDeleteEntries([...selectedIds]);
    exitSelectMode();
  };

  const saveEditor = () => {
    if (!editingEntry || !onUpdateEntry) return;
    const category = categories.find((item) => item.name === draftCategoryName);
    const targetActivity = category
      ? activities.find((item) => item.categoryId === category.id && item.name === draftActivityName.trim())
        || activities.find((item) => item.categoryId === category.id && !item.isArchived)
      : undefined;
    onUpdateEntry({
      ...editingEntry,
      activityId: targetActivity?.id || editingEntry.activityId,
      activityName: draftActivityName.trim() || editingEntry.activityName,
      categoryName: category?.name || editingEntry.categoryName,
      categoryColor: category?.color || editingEntry.categoryColor,
      categoryKind: category?.kind || editingEntry.categoryKind,
      emoji: category?.emoji || editingEntry.emoji,
    });
    setEditingEntry(null);
  };

  const deleteEditingEntry = () => {
    if (!editingEntry || !onDeleteEntries) return;
    if (!window.confirm(`Delete “${editingEntry.activityName}” from the ledger?`)) return;
    onDeleteEntries([editingEntry.id]);
    setEditingEntry(null);
  };

  return (
    <div className="flex flex-col gap-3 pt-1 pb-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="tf-ledger-eyebrow">THE LEDGER</span>
          <p className="mt-1 text-[11px] text-[rgba(var(--tf-ink-rgb),0.46)]">Hold an entry to edit it</p>
        </div>
        {entries.length > 0 && (
          <button type="button" onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))} className="tf-ledger-control">
            {selectMode ? 'Done' : 'Select'}
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <label className="tf-ledger-select-wrap">
            <span>Filter</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {availableCategoryNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className="tf-ledger-select-wrap">
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as LedgerSort)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="longest">Longest first</option>
              <option value="shortest">Shortest first</option>
            </select>
          </label>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-[26px] border border-dashed text-center gap-3 mt-1 border-[rgba(var(--tf-surf-rgb),0.15)] bg-white/[0.03]">
          <span className="text-[15px] font-bold">Nothing on the ledger yet.</span>
          <p className="max-w-[260px] text-[17px] italic opacity-70" style={{ fontFamily: 'var(--font-serif)' }}>An empty ring is still a whole day.</p>
          <button type="button" onClick={onOpenLogModal} className="tf-primary-pill">Log your first block</button>
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className="rounded-[22px] border border-[rgba(var(--tf-surf-rgb),0.1)] bg-white/[0.03] p-6 text-center text-sm opacity-65">No entries match this filter.</div>
      ) : (
        <div className="flex flex-col">
          {visibleEntries.map((entry, index) => {
            const hours = Math.floor(entry.durationSec / 3600);
            const minutes = Math.floor((entry.durationSec % 3600) / 60);
            const timeParts = formatTimeParts(entry.startedAtMs);
            const color = entry.categoryColor || '#818CF8';
            const selected = selectedIds.has(entry.id);

            return (
              <div
                key={entry.id}
                role={selectMode ? 'checkbox' : 'button'}
                aria-checked={selectMode ? selected : undefined}
                tabIndex={0}
                onPointerDown={(event) => beginHold(event, entry)}
                onPointerMove={moveHold}
                onPointerUp={clearHold}
                onPointerCancel={clearHold}
                onContextMenu={(event) => { event.preventDefault(); openEditor(entry); }}
                onClick={() => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  if (selectMode) toggleSelected(entry.id);
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  if (selectMode) toggleSelected(entry.id);
                  else openEditor(entry);
                }}
                className={`tf-ledger-row ${selected ? 'is-selected' : ''}`}
                style={{ borderBottom: index === visibleEntries.length - 1 ? 'none' : '1px solid rgba(var(--tf-surf-rgb), 0.07)' }}
              >
                {selectMode && <span className={`tf-check ${selected ? 'is-checked' : ''}`} aria-hidden="true">{selected ? '✓' : ''}</span>}
                <div className="w-[46px] flex-shrink-0 flex flex-col pt-0.5 font-mono text-[11px] opacity-55">
                  <span>{timeParts.time}</span>
                  {timeParts.period && <span className="text-[9.5px] opacity-70 mt-0.5">{timeParts.period}</span>}
                </div>
                <div className="pt-1.5 px-2 flex-shrink-0">
                  <span className="block w-[10px] h-[10px] rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}88` }} />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="truncate text-[15px] font-semibold">{entry.activityName}</div>
                  <div className="truncate mt-0.5 text-[11px] opacity-45">{entry.categoryName}</div>
                  {entry.notes?.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {entry.notes.map((note) => (
                        <div key={note.id} className="flex items-baseline gap-2">
                          <span className="flex-shrink-0 font-mono text-[9px] opacity-40">{formatNoteTime(note.createdAtMs)}</span>
                          <span className="text-[14px] italic opacity-75" style={{ fontFamily: 'var(--font-serif)' }}>{note.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!selectMode && onAddNote && (
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => { event.stopPropagation(); onAddNote(entry); }}
                      className="mt-2 tf-note-pill"
                    >
                      ＋ {entry.notes?.length ? `${entry.notes.length} note${entry.notes.length === 1 ? '' : 's'}` : 'add a note'}
                    </button>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-0.5">
                  <span className="text-[13px] font-semibold opacity-75">{hours > 0 ? `${hours}h ` : ''}{minutes}m</span>
                  {!selectMode && (
                    <button
                      type="button"
                      aria-label={`Edit ${entry.activityName}`}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => { event.stopPropagation(); openEditor(entry); }}
                      className="tf-entry-menu"
                    >
                      •••
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectMode && entries.length > 0 && (
        <div className="tf-selection-bar">
          <button type="button" onClick={() => setSelectedIds(new Set(visibleEntries.map((entry) => entry.id)))}>Select all</button>
          <span>{selectedIds.size} selected</span>
          <button type="button" className="text-red-300" disabled={selectedIds.size === 0} onClick={deleteSelected}>Delete</button>
        </div>
      )}

      {editingEntry && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 backdrop-blur-sm" onClick={() => setEditingEntry(null)}>
          <div className="tf-entry-editor tf-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[rgba(var(--tf-surf-rgb),0.2)]" />
            <div className="flex items-center justify-between">
              <div>
                <p className="tf-ledger-eyebrow">EDIT ENTRY</p>
                <h3 className="mt-1 text-xl font-bold">{editingEntry.emoji} {editingEntry.activityName}</h3>
              </div>
              <button type="button" onClick={() => setEditingEntry(null)} className="tf-entry-menu text-lg">×</button>
            </div>
            <label className="mt-5 block text-xs font-semibold opacity-65">
              Activity name
              <input value={draftActivityName} onChange={(event) => setDraftActivityName(event.target.value)} className="tf-editor-input mt-2" maxLength={80} />
            </label>
            <label className="mt-4 block text-xs font-semibold opacity-65">
              Category
              <select value={draftCategoryName} onChange={(event) => setDraftCategoryName(event.target.value)} className="tf-editor-input mt-2">
                {categories.map((category) => <option key={category.id} value={category.name}>{category.emoji} {category.name}</option>)}
              </select>
            </label>
            <div className="mt-6 grid grid-cols-[1fr_1.6fr] gap-2.5">
              <button type="button" onClick={deleteEditingEntry} className="tf-danger-pill">Delete</button>
              <button type="button" onClick={saveEditor} className="tf-primary-pill">Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

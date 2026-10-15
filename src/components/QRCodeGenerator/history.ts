// Undo/redo history as a pure reducer.
//
// `current` is the live state, updated on every edit. `entries` are the committed
// snapshots: a commit is dispatched once the user stops editing (debounce), so a burst of
// keystrokes becomes a single undo step. Undo/redo restore a whole snapshot.

export const MAX_HISTORY = 50;

export interface HistoryState<S> {
  entries: S[];
  // Index of the committed snapshot `current` was last synchronised with
  index: number;
  current: S;
}

export type HistoryAction<S> =
  | { type: 'edit'; update: (state: S) => S }
  | { type: 'commit' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; state: S };

export const createHistory = <S>(initial: S): HistoryState<S> => ({
  entries: [initial],
  index: 0,
  current: initial,
});

// True while `current` holds edits that are not committed yet
export const hasPendingEdits = <S>(history: HistoryState<S>): boolean =>
  history.current !== history.entries[history.index];

export const canUndo = <S>(history: HistoryState<S>): boolean =>
  history.index > 0 || hasPendingEdits(history);

export const canRedo = <S>(history: HistoryState<S>): boolean =>
  !hasPendingEdits(history) && history.index < history.entries.length - 1;

// Make the pending edits a new snapshot; this drops the redo branch
function commit<S>(history: HistoryState<S>): HistoryState<S> {
  if (!hasPendingEdits(history)) return history;
  const entries = [...history.entries.slice(0, history.index + 1), history.current];
  if (entries.length > MAX_HISTORY) entries.shift();
  return { entries, index: entries.length - 1, current: history.current };
}

export function historyReducer<S>(history: HistoryState<S>, action: HistoryAction<S>): HistoryState<S> {
  switch (action.type) {
    case 'edit': {
      const current = action.update(history.current);
      return current === history.current ? history : { ...history, current };
    }
    case 'commit':
      return commit(history);
    case 'undo': {
      // Pending edits are committed first, so undo steps back over them instead of dropping them
      const settled = commit(history);
      if (settled.index === 0) return settled;
      const index = settled.index - 1;
      return { ...settled, index, current: settled.entries[index] };
    }
    case 'redo': {
      const settled = commit(history);
      if (settled.index >= settled.entries.length - 1) return settled;
      const index = settled.index + 1;
      return { ...settled, index, current: settled.entries[index] };
    }
    case 'reset':
      // Itself an undo step
      return commit({ ...commit(history), current: action.state });
  }
}

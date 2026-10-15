import { describe, expect, it } from 'vitest';
import {
  MAX_HISTORY, canRedo, canUndo, createHistory, hasPendingEdits, historyReducer,
  type HistoryAction, type HistoryState,
} from './history';

type S = { text: string };
const run = (state: HistoryState<S>, ...actions: HistoryAction<S>[]) => actions.reduce(historyReducer, state);
const edit = (text: string): HistoryAction<S> => ({ type: 'edit', update: () => ({ text }) });

describe('history reducer', () => {
  it('starts clean', () => {
    const history = createHistory<S>({ text: 'a' });
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(false);
  });

  it('coalesces a burst of edits into one committed step', () => {
    const history = run(createHistory<S>({ text: '' }), edit('h'), edit('he'), edit('hel'), { type: 'commit' });
    expect(history.entries.map((s) => s.text)).toEqual(['', 'hel']);
    expect(hasPendingEdits(history)).toBe(false);
  });

  it('does not push an entry per edit', () => {
    const history = run(createHistory<S>({ text: '' }), edit('a'), edit('ab'));
    expect(history.entries).toHaveLength(1);
    expect(hasPendingEdits(history)).toBe(true);
    expect(canUndo(history)).toBe(true);
  });

  it('ignores an edit that changes nothing', () => {
    const initial = createHistory<S>({ text: 'a' });
    const history = run(initial, { type: 'edit', update: (s) => s }, { type: 'commit' });
    expect(history).toBe(initial);
  });

  it('undo restores the previous snapshot and redo moves forward again', () => {
    let history = run(createHistory<S>({ text: 'a' }), edit('b'), { type: 'commit' }, edit('c'), { type: 'commit' });
    history = run(history, { type: 'undo' });
    expect(history.current.text).toBe('b');
    expect(canRedo(history)).toBe(true);
    history = run(history, { type: 'undo' });
    expect(history.current.text).toBe('a');
    expect(canUndo(history)).toBe(false);
    history = run(history, { type: 'redo' }, { type: 'redo' });
    expect(history.current.text).toBe('c');
    expect(canRedo(history)).toBe(false);
  });

  it('undo with pending edits steps back over them and keeps them redoable', () => {
    let history = run(createHistory<S>({ text: 'a' }), edit('typing'));
    history = run(history, { type: 'undo' });
    expect(history.current.text).toBe('a');
    history = run(history, { type: 'redo' });
    expect(history.current.text).toBe('typing');
  });

  it('a new edit after undo drops the redo branch', () => {
    let history = run(createHistory<S>({ text: 'a' }), edit('b'), { type: 'commit' }, { type: 'undo' });
    history = run(history, edit('x'), { type: 'commit' });
    expect(history.entries.map((s) => s.text)).toEqual(['a', 'x']);
    expect(canRedo(history)).toBe(false);
  });

  it('keeps at most MAX_HISTORY entries', () => {
    let history = createHistory<S>({ text: '0' });
    for (let i = 1; i <= MAX_HISTORY + 10; i++) history = run(history, edit(String(i)), { type: 'commit' });
    expect(history.entries).toHaveLength(MAX_HISTORY);
    expect(history.current.text).toBe(String(MAX_HISTORY + 10));
    expect(history.entries[history.index]).toBe(history.current);
  });

  it('reset is an undo step that also keeps the pending edits', () => {
    let history = run(createHistory<S>({ text: 'a' }), edit('typing'), { type: 'reset', state: { text: 'initial' } });
    expect(history.current.text).toBe('initial');
    history = run(history, { type: 'undo' });
    expect(history.current.text).toBe('typing');
  });

  it('is pure: the reducer does not mutate its input', () => {
    const before = run(createHistory<S>({ text: 'a' }), edit('b'), { type: 'commit' });
    const snapshot = JSON.stringify(before);
    run(before, { type: 'undo' }, { type: 'redo' }, edit('c'), { type: 'commit' });
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

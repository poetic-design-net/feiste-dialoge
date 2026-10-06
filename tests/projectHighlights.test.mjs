import test from 'node:test';
import assert from 'node:assert/strict';
import { selectHighlights, highlightDescription } from '../src/lib/projectHighlights.ts';

const project = (slug, year, order, highlight = true) => ({ slug, data: { year, order, highlight } });

test('editorial order selects three highlights regardless of year or input order', () => {
  const projects = [
    project('newest', '2026', 4),
    project('second', '2025', 2),
    project('first', '2020', 1),
    project('disabled', '2026', 0, false),
    project('third', '2024', 3),
  ];
  const original = [...projects];
  assert.deepEqual(selectHighlights(projects).map(p => p.slug), ['first', 'second', 'third']);
  assert.deepEqual(projects, original);
  assert.deepEqual(selectHighlights([...projects].reverse()), selectHighlights(projects));
});

test('equal priorities are stable across pages and fewer than three highlights work', () => {
  const projects = [project('b', '2026', 0), project('a', '2025', 0)];
  assert.deepEqual(selectHighlights(projects).map(p => p.slug), ['a', 'b']);
  assert.deepEqual(selectHighlights([]), []);
});

test('missing, empty and whitespace subtitles fall back to the description', () => {
  for (const subtitle of [undefined, '', '  \n ']) {
    assert.equal(highlightDescription({ subtitle, description: ' Beschreibung. ' }), 'Beschreibung.');
  }
  assert.equal(highlightDescription({ subtitle: ' Untertitel ', description: 'Beschreibung' }), 'Untertitel');
});

test('only truncated descriptions receive an ellipsis', () => {
  assert.equal(highlightDescription({ description: 'a'.repeat(140) }), 'a'.repeat(140));
  assert.equal(highlightDescription({ description: 'a'.repeat(141) }), 'a'.repeat(140) + '…');
});

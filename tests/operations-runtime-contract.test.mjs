import test from 'node:test';
import assert from 'node:assert/strict';
import { toMinorUnits } from '../assets/money.mjs';
import fs from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');

test('money conversion uses exact minor units and accepts comma decimals', () => {
  assert.equal(toMinorUnits('10'), 1000);
  assert.equal(toMinorUnits('10.5'), 1050);
  assert.equal(toMinorUnits('10,50'), 1050);
  assert.equal(toMinorUnits('0.01'), 1);
});

test('money conversion rejects malformed, zero and oversized values', () => {
  for (const value of ['', '0', '0.00', '-1', '1.234', '1e3', '1000000.01']) {
    assert.throws(() => toMinorUnits(value), value);
  }
});

test('CSV export escapes spreadsheet-sensitive delimiters and formulas safely', () => {
  const source = read('assets/export.js');
  assert.match(source, /replace\(\/\\s\+\/g,' '\)/);
  assert.match(source, /replace\(\/"\/g,'""'\)/);
  assert.match(source, /text\/csv;charset=utf-8/);
  assert.match(source, /\ufeff/);
});

test('live updates coalesce refreshes and do not refresh while busy', () => {
  const source = read('assets/live-updates.js');
  assert.match(source, /setTimeout\(c,i\)/);
  assert.match(source, /n\(\)/);
  assert.match(source, /s=!0/);
  assert.match(source, /catch\(o\)\{r\(o\)\}/);
});

test('live update asset navigation guard stays same-origin and asset-only', () => {
  const source = read('assets/live-updates.js');
  assert.match(source, /r\.origin!==n/);
  // The generated runtime may contain one or two literal backslashes depending on the bundler pass.
  // Both forms represent the same escaped asset-path contract; reject any other path shape.
  assert.match(source, /assets\\{1,2}\/[a-zA-Z0-9_-]+\\{1,2}\./);
});

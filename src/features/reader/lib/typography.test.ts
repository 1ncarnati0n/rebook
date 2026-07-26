// node --experimental-strip-types src/features/reader/lib/typography.test.ts
import assert from 'node:assert/strict';
import { toRemFontSize } from './typography.ts';

assert.equal(toRemFontSize('24px'), '1.5rem');
assert.equal(toRemFontSize('16px'), '1rem');
assert.equal(toRemFontSize('10pt'), '0.833rem');
assert.equal(toRemFontSize('12PT'), '1rem');
assert.equal(toRemFontSize('  .5px '), '0.031rem');

// Relative and keyword values already scale; leave them alone.
assert.equal(toRemFontSize('1.2em'), null);
assert.equal(toRemFontSize('120%'), null);
assert.equal(toRemFontSize('1.5rem'), null);
assert.equal(toRemFontSize('medium'), null);
assert.equal(toRemFontSize('larger'), null);
assert.equal(toRemFontSize(''), null);

// Idempotent: the output never matches again.
assert.equal(toRemFontSize(toRemFontSize('24px')!), null);

console.log('typography: ok');

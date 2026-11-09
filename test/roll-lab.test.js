'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSeededRandom, exactDistribution, simulateDice } = require('../src/roll-lab');
const { parseArgs } = require('../src/cli');

test('exact distribution for two six-sided dice has 36 outcomes', () => {
  const counts = exactDistribution(2, 6);
  assert.equal(counts.reduce((sum, value) => sum + value, 0n), 36n);
  assert.equal(counts[7], 6n);
  assert.equal(counts[2], 1n);
  assert.equal(counts[12], 1n);
});

test('calculates the exact probability of rolling at least seven on 2d6', () => {
  const result = simulateDice({ dice: 2, sides: 6, trials: 20, target: 7, random: () => 0 });
  assert.equal(result.exactTargetProbability, 21 / 36);
  assert.equal(result.targetHits, 0);
  assert.equal(result.targetMisses, 20);
});

test('simulates all possible sums and preserves the trial total', () => {
  const result = simulateDice({ dice: 2, sides: 6, trials: 1000, seed: 'histogram' });
  assert.equal(result.distribution.reduce((sum, row) => sum + row.observedCount, 0), 1000);
  assert.equal(result.distribution.length, 11);
});

test('seeded runs are deterministic', () => {
  const options = { dice: 3, sides: 10, trials: 2000, target: 20, seed: 'fixed-seed' };
  assert.deepEqual(simulateDice(options), simulateDice(options));
  assert.equal(createSeededRandom('x')(), createSeededRandom('x')());
});

test('validates dice, sides, trial count, and target', () => {
  assert.throws(() => simulateDice({ sides: 1 }), /sides/);
  assert.throws(() => simulateDice({ dice: 11 }), /dice/);
  assert.throws(() => simulateDice({ trials: 0 }), /trials/);
  assert.throws(() => simulateDice({ trials: 5000001 }), /trials/);
  assert.throws(() => simulateDice({ dice: 2, sides: 6, target: 13 }), /target/);
});

test('rejects invalid random sources', () => {
  assert.throws(() => simulateDice({ dice: 1, trials: 1, random: () => -0.1 }), /interval/);
  assert.throws(() => simulateDice({ dice: 1, trials: 1, random: () => NaN }), /interval/);
});

test('CLI parser recognizes supported flags and rejects unknown options', () => {
  assert.deepEqual(parseArgs(['--sides', '8', '--dice', '3', '--seed', 'demo', '--json']), {
    options: { sides: 8, dice: 3, seed: 'demo' },
    json: true
  });
  assert.equal(parseArgs(['--help']).help, true);
  assert.throws(() => parseArgs(['--unknown']), /Unknown option/);
});

'use strict';

const MAX_TRIALS = 5_000_000;

function integerInRange(value, name, minimum, maximum) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new RangeError(name + ' must be an integer from ' + minimum + ' to ' + maximum + '.');
  }
  return parsed;
}

function hashSeed(seed) {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let state = hashSeed(seed);
  return function random() {
    state = (state + 0x6D2B79F5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function wilsonInterval(successes, total) {
  const z = 1.96;
  const proportion = successes / total;
  const denominator = 1 + (z * z) / total;
  const centre = (proportion + (z * z) / (2 * total)) / denominator;
  const margin = (z * Math.sqrt((proportion * (1 - proportion) + (z * z) / (4 * total)) / total)) / denominator;
  return { lower: Math.max(0, centre - margin), upper: Math.min(1, centre + margin) };
}

function exactDistribution(dice, sides) {
  let counts = [1n];
  for (let die = 0; die < dice; die += 1) {
    const next = Array(counts.length + sides).fill(0n);
    for (let sum = 0; sum < counts.length; sum += 1) {
      for (let face = 1; face <= sides; face += 1) {
        next[sum + face] += counts[sum];
      }
    }
    counts = next;
  }
  return counts;
}

function simulateDice(options = {}) {
  const sides = integerInRange(options.sides ?? 6, 'sides', 2, 100);
  const dice = integerInRange(options.dice ?? 2, 'dice', 1, 10);
  const trials = integerInRange(options.trials ?? 100_000, 'trials', 1, MAX_TRIALS);
  const minimum = dice;
  const maximum = dice * sides;
  const defaultTarget = Math.ceil(dice * (sides + 1) / 2);
  const target = integerInRange(options.target ?? defaultTarget, 'target', minimum, maximum);
  const random = options.random ?? (options.seed === undefined ? Math.random : createSeededRandom(options.seed));
  if (typeof random !== 'function') throw new TypeError('random must be a function.');

  const counts = exactDistribution(dice, sides);
  const totalOutcomes = BigInt(sides) ** BigInt(dice);
  const theoreticalTargetOutcomes = counts.slice(target).reduce((sum, count) => sum + count, 0n);
  const histogram = Array(maximum + 1).fill(0);

  for (let trial = 0; trial < trials; trial += 1) {
    let total = 0;
    for (let die = 0; die < dice; die += 1) {
      const sample = random();
      if (typeof sample !== 'number' || !Number.isFinite(sample) || sample < 0 || sample >= 1) {
        throw new RangeError('random must return a finite number in the interval [0, 1).');
      }
      total += 1 + Math.floor(sample * sides);
    }
    histogram[total] += 1;
  }

  const observedAtTarget = histogram.slice(target).reduce((sum, count) => sum + count, 0);
  const exactProbability = Number(theoreticalTargetOutcomes) / Number(totalOutcomes);
  const observedProbability = observedAtTarget / trials;
  const distribution = [];

  for (let sum = minimum; sum <= maximum; sum += 1) {
    distribution.push({
      sum,
      exactProbability: Number(counts[sum]) / Number(totalOutcomes),
      observedCount: histogram[sum],
      observedProbability: histogram[sum] / trials
    });
  }

  return {
    sides,
    dice,
    trials,
    target,
    expectedSum: dice * (sides + 1) / 2,
    variance: dice * (sides * sides - 1) / 12,
    targetHits: observedAtTarget,
    targetMisses: trials - observedAtTarget,
    exactTargetProbability: exactProbability,
    observedTargetProbability: observedProbability,
    confidence95: wilsonInterval(observedAtTarget, trials),
    seed: options.seed === undefined ? null : String(options.seed),
    distribution
  };
}

module.exports = { MAX_TRIALS, createSeededRandom, exactDistribution, simulateDice, wilsonInterval };

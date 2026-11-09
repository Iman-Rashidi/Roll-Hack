#!/usr/bin/env node
'use strict';

const { simulateDice } = require('./roll-lab');

const HELP = 'Roll Outcome Lab — discrete probability explorer\n\n' +
  'Usage: node src/cli.js [options]\n\n' +
  'Options:\n' +
  '  --sides <n>    Faces per die (default: 6; range: 2–100)\n' +
  '  --dice <n>     Number of dice (default: 2; range: 1–10)\n' +
  '  --trials <n>   Trials (default: 100000; max: 5000000)\n' +
  '  --target <n>   Count sums >= target (default: rounded-up expected sum)\n' +
  '  --seed <text>  Reproducible seed (optional)\n' +
  '  --json         Print machine-readable JSON\n' +
  '  --help         Show this help\n\n' +
  'Offline-only educational simulator. No account or network access is used.\n';

function parseArgs(argv) {
  const options = {};
  let json = false;
  const allowed = new Set(['--sides', '--dice', '--trials', '--target', '--seed']);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') return { help: true };
    if (argument === '--json') {
      json = true;
      continue;
    }
    if (!allowed.has(argument)) throw new Error('Unknown option: ' + argument);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error('Missing value for ' + argument);
    }
    index += 1;
    const key = argument.slice(2);
    options[key] = key === 'seed' ? value : Number(value);
  }

  return { options, json };
}

function percent(value) {
  return (value * 100).toFixed(3) + '%';
}

function main(argv = process.argv.slice(2)) {
  try {
    const parsed = parseArgs(argv);
    if (parsed.help) {
      process.stdout.write(HELP);
      return 0;
    }

    const result = simulateDice(parsed.options);
    if (parsed.json) {
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      return 0;
    }

    const lines = [
      'Roll Outcome Lab — simulation report',
      '------------------------------------',
      'Dice:                    ' + result.dice + ' × d' + result.sides,
      'Trials:                  ' + result.trials.toLocaleString(),
      'Target:                  total >= ' + result.target,
      'Target hits / misses:    ' + result.targetHits.toLocaleString() + ' / ' + result.targetMisses.toLocaleString(),
      'Exact target probability: ' + percent(result.exactTargetProbability),
      'Observed probability:     ' + percent(result.observedTargetProbability),
      '95% Wilson interval:      ' + percent(result.confidence95.lower) + ' – ' + percent(result.confidence95.upper),
      'Expected sum:             ' + result.expectedSum.toFixed(3),
      'Variance:                 ' + result.variance.toFixed(3),
      'Seed:                     ' + (result.seed === null ? '(not fixed)' : result.seed),
      '',
      'Sum | Exact % | Observed count | Observed %'
    ];
    result.distribution.forEach(function (row) {
      lines.push(
        String(row.sum).padStart(3) + ' | ' +
        percent(row.exactProbability).padStart(8) + ' | ' +
        String(row.observedCount).padStart(14) + ' | ' +
        percent(row.observedProbability)
      );
    });
    process.stdout.write(lines.join('\n') + '\n');
    return 0;
  } catch (error) {
    process.stderr.write('Error: ' + error.message + '\nRun with --help for usage.\n');
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { main, parseArgs };

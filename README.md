# Roll Outcome Lab

Roll Outcome Lab is a standalone command-line tool for exploring discrete random experiments. It compares Monte Carlo observations with an exact probability distribution for one or more fair, independent dice.

## Scope

This project is deliberately independent of any third-party platform. It does not log in to websites, automate rolls, make network requests, place bets, or access accounts or funds. It is an educational statistics tool, not a predictor.

## Requirements

- Node.js 20 or newer
- No third-party runtime dependencies

## Quick start

    npm test
    npm start -- --sides 6 --dice 2 --trials 100000 --target 7 --seed demo

The command simulates the sum of the specified number of fair dice. The target metric counts sums greater than or equal to the target.

## Options

| Option | Default | Meaning |
|---|---:|---|
| --sides | 6 | Number of faces per die (2–100) |
| --dice | 2 | Number of dice per trial (1–10) |
| --trials | 100000 | Number of trials (1–5,000,000) |
| --target | calculated | Count totals greater than or equal to this value |
| --seed | none | Optional seed for repeatable runs |
| --json | off | Print machine-readable JSON |
| --help | — | Show usage |

Examples:

    node src/cli.js --sides 6 --dice 2 --trials 250000 --target 7
    node src/cli.js --sides 20 --dice 3 --trials 100000 --target 40 --seed experiment-02 --json

## What the report contains

- An exact theoretical distribution computed by integer convolution
- The observed frequency for every possible sum
- The exact probability and observed frequency of reaching the chosen target
- A 95% Wilson interval for the observed target frequency
- The theoretical expected sum and variance

The optional seeded generator is a deterministic pseudo-random generator for reproducible testing. It is not cryptographically secure and must not be used for keys, tokens, betting, or production randomness.

## Attribution

This repository started as a small research placeholder created by Iman Rashidi. The current Roll Outcome Lab implementation and maintenance are by **Iman Rashidi** ([Iman-Rashidi](https://github.com/Iman-Rashidi)).

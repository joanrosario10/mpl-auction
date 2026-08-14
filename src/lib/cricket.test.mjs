// Run with: node src/lib/cricket.test.mjs
import assert from 'node:assert/strict'
import { battingCard, bowlingCard, chase, oversOf, summarise } from './cricket.js'

const d = (o = {}) => ({ runs: 0, extra: null, extra_runs: 0, wicket: false, ...o })

// A wide costs a run but does not advance the over; 7 legal balls is 1.1.
assert.equal(oversOf(7), '1.1')
assert.equal(summarise([d({ extra: 'wide', extra_runs: 1 })]).balls, 0)
assert.equal(summarise([d({ extra: 'wide', extra_runs: 1 })]).runs, 1)

// A wide to the boundary is 5, still no ball faced.
const wide4 = summarise([d({ extra: 'wide', extra_runs: 5 })])
assert.equal(wide4.runs, 5)
assert.equal(wide4.balls, 0)

// A no-ball with 4 off the bat: 5 runs, over does not advance.
const nb = summarise([d({ runs: 4, extra: 'noball', extra_runs: 1 })])
assert.equal(nb.runs, 5)
assert.equal(nb.balls, 0)

// Byes count as a ball bowled but not as runs to the batsman.
const byes = [d({ striker: 'a', bowler: 'x', extra: 'bye', extra_runs: 2 })]
assert.equal(summarise(byes).balls, 1)
assert.equal(battingCard(byes).get('a').runs, 0)
assert.equal(bowlingCard(byes).get('x').runs, 0, 'byes are not charged to the bowler')

// A wide is charged to the bowler; a wide is not a ball faced by the batsman.
const wides = [d({ striker: 'a', bowler: 'x', extra: 'wide', extra_runs: 1 })]
assert.equal(bowlingCard(wides).get('x').runs, 1)
assert.equal(battingCard(wides).get('a').balls, 0)

// Chase: 40 to win off 5 overs, 12 scored off 1 over -> 29 needed off 24.
const first = Array.from({ length: 30 }, () => d({ runs: 1 }))
const second = [d({ runs: 6 }), d({ runs: 6 }), d(), d(), d(), d()]
const c = chase(first, second, 5)
assert.equal(c.target, 31)
assert.equal(c.need, 19)
assert.equal(c.ballsLeft, 24)
assert.equal(c.won, false)

// Passing the target ends it.
assert.equal(chase(first, Array.from({ length: 31 }, () => d({ runs: 1 })), 5).won, true)

console.log('cricket.js ok')

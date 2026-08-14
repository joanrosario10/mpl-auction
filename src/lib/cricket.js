/** A wide or a no-ball does not count towards the over. */
export const isLegal = d => !d.extra || d.extra === 'bye' || d.extra === 'legbye'

/** 7 legal balls reads as 1.1 overs, not 1.16. */
export const oversOf = balls => `${Math.floor(balls / 6)}.${balls % 6}`

export const runRate = (runs, balls) =>
  balls === 0 ? '0.00' : ((runs / balls) * 6).toFixed(2)

/** Every figure on the card comes from the deliveries, never from a stored total. */
export function summarise(deliveries) {
  const runs = deliveries.reduce((n, d) => n + d.runs + d.extra_runs, 0)
  const wickets = deliveries.filter(d => d.wicket).length
  const balls = deliveries.filter(isLegal).length
  return { runs, wickets, balls, overs: oversOf(balls), rr: runRate(runs, balls) }
}

export function battingCard(deliveries) {
  const byPlayer = new Map()
  for (const d of deliveries) {
    if (!d.striker) continue
    const row = byPlayer.get(d.striker) ?? { runs: 0, balls: 0, out: false }
    row.runs += d.runs
    if (d.extra !== 'wide') row.balls += 1
    if (d.wicket && d.out_player === d.striker) row.out = true
    byPlayer.set(d.striker, row)
  }
  return byPlayer
}

export function bowlingCard(deliveries) {
  const byPlayer = new Map()
  for (const d of deliveries) {
    if (!d.bowler) continue
    const row = byPlayer.get(d.bowler) ?? { runs: 0, balls: 0, wickets: 0 }
    row.runs += d.runs + (d.extra === 'wide' || d.extra === 'noball' ? d.extra_runs : 0)
    if (isLegal(d)) row.balls += 1
    if (d.wicket) row.wickets += 1
    byPlayer.set(d.bowler, row)
  }
  return byPlayer
}

/**
 * Second-innings state. The target is one more than the first innings made,
 * and the chase is measured against balls remaining, not overs bowled.
 */
export function chase(firstInnings, secondInnings, totalOvers) {
  const target = summarise(firstInnings).runs + 1
  const now = summarise(secondInnings)
  const ballsLeft = totalOvers * 6 - now.balls
  const need = target - now.runs
  return {
    target,
    need: Math.max(0, need),
    ballsLeft: Math.max(0, ballsLeft),
    required: ballsLeft > 0 && need > 0 ? ((need / ballsLeft) * 6).toFixed(2) : '0.00',
    won: need <= 0,
    lost: ballsLeft <= 0 && need > 0,
  }
}

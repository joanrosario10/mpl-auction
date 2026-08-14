import { chase, summarise } from '../lib/cricket'

/** Read-only score, used on the projector and inside the admin dashboard. */
export function Scoreboard({ match, deliveries, teams, compact = false }) {
  if (!match) return null

  const innings = deliveries.filter(d => d.innings === match.innings)
  const { runs, wickets, overs, rr } = summarise(innings)
  const target = match.innings === 2
    ? chase(deliveries.filter(d => d.innings === 1), innings, match.overs)
    : null
  const batting = teams.find(t => t.id === match.batting_team)
  const bowling = teams.find(t => t.id !== match.batting_team &&
    (t.id === match.team_a || t.id === match.team_b))

  return (
    <div className={compact ? 'score compact' : 'score'}>
      <span className="board-label">{match.name} · innings {match.innings}</span>
      <b>{batting?.name ?? 'batting'} {runs}/{wickets}</b>
      <span className="score-sub">
        {overs} of {match.overs} overs · run rate {rr}
        {bowling ? ` · bowling ${bowling.name}` : ''}
      </span>
      {target && (
        <span className="chase">
          {target.won ? 'chase complete'
            : target.lost ? 'defended'
            : `needs ${target.need} from ${target.ballsLeft} · req ${target.required}`}
        </span>
      )}
    </div>
  )
}

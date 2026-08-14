import { useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { useMatch } from '../hooks/useMatch'
import { useAllSquads } from '../hooks/useAllSquads'
import { battingCard, bowlingCard, chase, isLegal, oversOf, summarise } from '../lib/cricket'
import { StartMatch } from './StartMatch'

const MODES = [
  { key: 'ball', label: 'runs' },
  { key: 'wide', label: 'wide' },
  { key: 'noball', label: 'no ball' },
  { key: 'bye', label: 'bye' },
  { key: 'legbye', label: 'leg bye' },
]
const RUNS = [0, 1, 2, 3, 4, 5, 6]

/**
 * Extras follow the laws: a wide and a no-ball each concede one penalty run,
 * runs off a no-ball are the batsman's, runs off a wide or a bye are not.
 */
function deliveryFrom(mode, runs) {
  if (mode === 'wide') return { runs: 0, extra: 'wide', extra_runs: 1 + runs }
  if (mode === 'noball') return { runs, extra: 'noball', extra_runs: 1 }
  if (mode === 'bye' || mode === 'legbye') return { runs: 0, extra: mode, extra_runs: runs }
  return { runs, extra: null, extra_runs: 0 }
}

export function UmpireConsole() {
  const { match, deliveries, error, reload } = useMatch()
  const { teams } = useAllSquads()
  const [mode, setMode] = useState('ball')
  const [wicket, setWicket] = useState(false)
  const [striker, setStriker] = useState('')
  const [nonStriker, setNonStriker] = useState('')
  const [bowler, setBowler] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const innings = useMemo(
    () => deliveries.filter(d => d.innings === match?.innings),
    [deliveries, match?.innings],
  )
  const firstInnings = useMemo(() => deliveries.filter(d => d.innings === 1), [deliveries])
  const target = match?.innings === 2 ? chase(firstInnings, innings, match.overs) : null
  const totals = summarise(innings)
  const last = innings[innings.length - 1]
  const freeHit = last?.extra === 'noball'
  const thisOver = innings.slice(-(innings.length % 6 === 0 ? 6 : innings.length % 6))

  const battingTeam = teams.find(t => t.id === match?.batting_team)
  const bowlingTeam = teams.find(
    t => t.id !== match?.batting_team && (t.id === match?.team_a || t.id === match?.team_b))
  const bat = battingCard(innings)
  const bowl = bowlingCard(innings)

  // The umpire fixes the match themselves — A vs B, overs, who bats first.
  if (!match) return <StartMatch teams={teams} onDone={reload} />

  const record = async (runs) => {
    if (!striker || !bowler) return setErr('Choose the striker and the bowler first.')
    setBusy(true)
    setErr('')
    const d = deliveryFrom(mode, runs)
    const { error: e } = await supabase.from('deliveries').insert({
      match_id: match.id,
      innings: match.innings,
      seq: innings.length + 1,
      striker, bowler,
      ...d,
      wicket,
      out_player: wicket ? striker : null,
    })
    setBusy(false)
    if (e) return setErr(e.message)

    // Odd runs and the end of an over both change who is on strike.
    const overEnded = isLegal({ extra: d.extra }) && (totals.balls + 1) % 6 === 0
    const crossed = (d.runs + (d.extra === 'bye' || d.extra === 'legbye' ? d.extra_runs : 0)) % 2 === 1
    if (crossed !== overEnded) {
      setStriker(nonStriker)
      setNonStriker(striker)
    }
    setMode('ball')
    setWicket(false)
    reload()
  }

  const endInnings = async () => {
    setBusy(true)
    const { error: e } = await supabase.from('matches')
      .update({ innings: 2, batting_team: bowlingTeam.id }).eq('id', match.id)
    setBusy(false)
    if (e) return setErr(e.message)
    setStriker('')
    setNonStriker('')
    setBowler('')
    reload()
  }

  const endMatch = async () => {
    setBusy(true)
    const { error: e } = await supabase.from('matches')
      .update({ status: 'done' }).eq('id', match.id)
    setBusy(false)
    if (e) setErr(e.message)
    else reload()
  }

  const undo = async () => {
    if (!last) return
    const { error: e } = await supabase.from('deliveries').delete().eq('id', last.id)
    if (e) setErr(e.message)
    else reload()
  }

  const squad = team => team?.players ?? []
  const nameOf = id => squad(battingTeam).concat(squad(bowlingTeam)).find(p => p.id === id)?.name ?? ''

  return (
    <>
      <div className="glass score">
        <span className="board-label">{match.name} · innings {match.innings}</span>
        <b>{battingTeam?.name} {totals.runs}/{totals.wickets}</b>
        <span className="score-sub">
          {totals.overs} of {match.overs} overs · run rate {totals.rr}
        </span>
        {target && (
          <p className="chase">
            {target.won ? 'target reached — chase complete'
              : target.lost ? `${target.need} short — defended`
              : `needs ${target.need} from ${target.ballsLeft} balls · required ${target.required}`}
          </p>
        )}
        {freeHit && <p className="freehit">free hit</p>}
        <div className="over-strip">
          {thisOver.map(d => (
            <span key={d.id} className={isLegal(d) ? 'b' : 'b extra'}>
              {d.wicket ? 'W'
                : d.extra === 'wide' ? `wd${d.extra_runs > 1 ? d.extra_runs - 1 : ''}`
                : d.extra === 'noball' ? `nb${d.runs || ''}`
                : d.extra ? `${d.extra === 'bye' ? 'b' : 'lb'}${d.extra_runs}`
                : d.runs}
            </span>
          ))}
        </div>
      </div>

      <div className="glass">
        <h1>Who's in</h1>
        <select value={striker} onChange={e => setStriker(e.target.value)}>
          <option value="">striker…</option>
          {squad(battingTeam).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={nonStriker} onChange={e => setNonStriker(e.target.value)}>
          <option value="">non-striker…</option>
          {squad(battingTeam).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={bowler} onChange={e => setBowler(e.target.value)}>
          <option value="">bowler…</option>
          {squad(bowlingTeam).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="glass umpire">
        <h1>Record a ball</h1>

        <div className="modes">
          {MODES.map(m => (
            <button key={m.key} type="button"
                    className={mode === m.key ? 'on' : ''}
                    onClick={() => setMode(m.key)}>{m.label}</button>
          ))}
          <button type="button" className={wicket ? 'on danger' : 'danger'}
                  onClick={() => setWicket(w => !w)}>wicket</button>
        </div>

        <p className="muted"><small>
          {mode === 'ball' && 'Runs off the bat.'}
          {mode === 'wide' && 'One penalty run, plus anything run after it — tap 4 for a wide that goes to the boundary.'}
          {mode === 'noball' && 'One penalty run, plus runs off the bat. The next ball is a free hit.'}
          {mode === 'bye' && 'Runs taken without the bat, charged to nobody.'}
          {mode === 'legbye' && 'Runs off the body, not the bat.'}
          {wicket && ' Wicket will be recorded against the striker.'}
        </small></p>

        <div className="runs">
          {RUNS.map(r => (
            <button key={r} type="button" disabled={busy} onClick={() => record(r)}>{r}</button>
          ))}
        </div>

        <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
          {match.innings === 1 && (
            <button type="button" onClick={endInnings} disabled={busy}>
              End innings — set target {totals.runs + 1}
            </button>
          )}
          {match.innings === 2 && (
            <button type="button" onClick={endMatch} disabled={busy}>End match</button>
          )}
        </div>

        <p><button type="button" className="link" onClick={undo} disabled={!last}>
          undo last ball {last ? `(${nameOf(last.striker) || 'ball'})` : ''}
        </button></p>

        {(err || error) && <p className="err">{err || error}</p>}
      </div>

      <div className="glass">
        <h1>Batting</h1>
        <table>
          <thead><tr><th>batsman</th><th>R</th><th>B</th></tr></thead>
          <tbody>
            {squad(battingTeam).filter(p => bat.has(p.id)).map(p => (
              <tr key={p.id}>
                <td>{p.name}{bat.get(p.id).out ? '' : ' *'}</td>
                <td>{bat.get(p.id).runs}</td>
                <td>{bat.get(p.id).balls}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h1>Bowling</h1>
        <table>
          <thead><tr><th>bowler</th><th>O</th><th>R</th><th>W</th></tr></thead>
          <tbody>
            {squad(bowlingTeam).filter(p => bowl.has(p.id)).map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{oversOf(bowl.get(p.id).balls)}</td>
                <td>{bowl.get(p.id).runs}</td>
                <td>{bowl.get(p.id).wickets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

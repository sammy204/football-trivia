import { useState } from 'react'
import styles from './Home.module.css'

const ROUNDS = [5, 10, 15]

export default function Home({ onStartSolo, onStartMulti }) {
  const [tab, setTab] = useState('solo')
  const [rounds, setRounds] = useState(5)
  const [soloName, setSoloName] = useState('')
  const [players, setPlayers] = useState(['', ''])

  function addPlayer() {
    if (players.length < 4) setPlayers([...players, ''])
  }
  function updatePlayer(i, val) {
    const p = [...players]; p[i] = val; setPlayers(p)
  }

  function handleSolo() {
    onStartSolo({ name: soloName.trim() || 'Player', rounds })
  }
  function handleMulti() {
    const names = players.map(p => p.trim()).filter(Boolean)
    if (names.length < 2) return alert('Enter at least 2 player names.')
    onStartMulti({ players: names, rounds })
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>Football<br />Trivia</h1>
        <p className={styles.sub}>Test your knowledge. Beat your mates.</p>
      </header>

      <div className={styles.tabs}>
        {['solo', 'multi'].map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'solo' ? 'Solo' : 'Multiplayer'}
          </button>
        ))}
      </div>

      <div className={styles.section}>
        <p className={styles.label}>Rounds</p>
        <div className={styles.roundGrid}>
          {ROUNDS.map(r => (
            <button key={r} className={`${styles.chip} ${rounds === r ? styles.chipActive : ''}`} onClick={() => setRounds(r)}>{r} rounds</button>
          ))}
        </div>
      </div>

      {tab === 'solo' && (
        <div className={styles.section}>
          <p className={styles.label}>Your name</p>
          <input className={styles.input} placeholder="Enter your name" value={soloName} onChange={e => setSoloName(e.target.value)} />
          <button className={styles.startBtn} onClick={handleSolo}>Kick off →</button>
        </div>
      )}

      {tab === 'multi' && (
        <div className={styles.section}>
          <p className={styles.label}>Players</p>
          {players.map((p, i) => (
            <input key={i} className={styles.input} placeholder={`Player ${i + 1}`} value={p} onChange={e => updatePlayer(i, e.target.value)} style={{ marginBottom: 8 }} />
          ))}
          {players.length < 4 && (
            <button className={styles.addBtn} onClick={addPlayer}>+ Add player</button>
          )}
          <button className={styles.startBtn} onClick={handleMulti} style={{ marginTop: 12 }}>Kick off →</button>
        </div>
      )}
    </div>
  )
}

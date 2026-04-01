import { useState } from 'react'
import styles from './Home.module.css'

const ROUNDS = [5, 10, 15]

export default function Home({ onStartSolo, onStartMulti, onStartOnline }) {
  const [sport, setSport] = useState('football')
  const [tab, setTab] = useState('solo')
  const [rounds, setRounds] = useState(5)
  const [soloName, setSoloName] = useState('')
  const [players, setPlayers] = useState(['', ''])

  const isBasketball = sport === 'basketball'
  const accent = isBasketball ? '#FF6B35' : '#00FF87'
  const accentDark = isBasketball ? '#e55a28' : '#00C96B'
  const accentBg = isBasketball ? 'rgba(255,107,53,0.08)' : 'rgba(0,255,135,0.08)'
  const accentText = isBasketball ? '#fff' : '#0a1f0f'

  function addPlayer() {
    if (players.length < 4) setPlayers([...players, ''])
  }
  function updatePlayer(i, val) {
    const p = [...players]; p[i] = val; setPlayers(p)
  }

  function handleSolo() {
    onStartSolo({ name: soloName.trim() || 'Player', rounds, sport })
  }
  function handleMulti() {
    const names = players.map(p => p.trim()).filter(Boolean)
    if (names.length < 2) return alert('Enter at least 2 player names.')
    onStartMulti({ players: names, rounds, sport })
  }

  const chipActiveStyle = { borderColor: accent, color: accent, background: accentBg }
  const startBtnStyle = { background: accent, color: accentText }
  const tabActiveStyle = { background: accent, color: accentText, borderColor: accent }
  const sportActiveStyle = (s) => s === sport ? {
    borderColor: accent, color: accent, background: accentBg, fontWeight: 700,
  } : {}

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {isBasketball ? <>Basket<br />ball</> : <>Football<br />Trivia</>}
        </h1>
        <p className={styles.sub}>Test your knowledge. Beat your mates.</p>
      </header>

      {/* Sport Picker */}
      <div className={styles.section}>
        <p className={styles.label}>Choose your sport</p>
        <div className={styles.sportGrid}>
          {[
            { key: 'football', emoji: '⚽', label: 'Football' },
            { key: 'basketball', emoji: '🏀', label: 'Basketball' },
          ].map(s => (
            <button
              key={s.key}
              className={styles.sportBtn}
              style={sportActiveStyle(s.key)}
              onClick={() => setSport(s.key)}
            >
              <span className={styles.sportEmoji}>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Tabs */}
      <div className={styles.tabs}>
        {['solo', 'multi', 'online'].map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            style={tab === t ? tabActiveStyle : {}}
            onClick={() => setTab(t)}
          >
            {t === 'solo' ? 'Solo' : t === 'multi' ? 'Local' : '🌐 Online'}
          </button>
        ))}
      </div>

      {/* Rounds — only for solo and local */}
      {tab !== 'online' && (
        <div className={styles.section}>
          <p className={styles.label}>Rounds</p>
          <div className={styles.roundGrid}>
            {ROUNDS.map(r => (
              <button
                key={r}
                className={styles.chip}
                style={rounds === r ? chipActiveStyle : {}}
                onClick={() => setRounds(r)}
              >
                {r} rounds
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Solo */}
      {tab === 'solo' && (
        <div className={styles.section}>
          <p className={styles.label}>Your name</p>
          <input
            className={styles.input}
            placeholder="Enter your name"
            value={soloName}
            onChange={e => setSoloName(e.target.value)}
          />
          <button className={styles.startBtn} style={startBtnStyle} onClick={handleSolo}>
            {isBasketball ? 'Tip off →' : 'Kick off →'}
          </button>
        </div>
      )}

      {/* Local Multiplayer */}
      {tab === 'multi' && (
        <div className={styles.section}>
          <p className={styles.label}>Players</p>
          {players.map((p, i) => (
            <input
              key={i}
              className={styles.input}
              placeholder={`Player ${i + 1}`}
              value={p}
              onChange={e => updatePlayer(i, e.target.value)}
              style={{ marginBottom: 8 }}
            />
          ))}
          {players.length < 4 && (
            <button className={styles.addBtn} style={{ color: accent }} onClick={addPlayer}>
              + Add player
            </button>
          )}
          <button className={styles.startBtn} style={{ ...startBtnStyle, marginTop: 12 }} onClick={handleMulti}>
            {isBasketball ? 'Tip off →' : 'Kick off →'}
          </button>
        </div>
      )}

      {/* Online Multiplayer */}
      {tab === 'online' && (
        <div className={styles.section}>
          <p className={styles.onlineDesc}>
            Play against a friend anywhere in the world. Create a room and share the code, or join an existing room.
          </p>
          <button className={styles.startBtn} style={startBtnStyle} onClick={() => onStartOnline(sport)}>
            Enter Online Lobby →
          </button>
        </div>
      )}
    </div>
  )
}
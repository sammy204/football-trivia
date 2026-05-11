import styles from './Landing.module.css'

const PARTICLES = [
  { emoji: '⚽', x: 8, y: 15, size: 52, duration: 6, delay: 0 },
  { emoji: '🏀', x: 88, y: 10, size: 48, duration: 8, delay: 1 },
  { emoji: '⚽', x: 75, y: 70, size: 44, duration: 7, delay: 2 },
  { emoji: '🏀', x: 12, y: 75, size: 50, duration: 9, delay: 0.5 },
  { emoji: '⚽', x: 90, y: 40, size: 42, duration: 6.5, delay: 3 },
  { emoji: '🏀', x: 5, y: 45, size: 46, duration: 8.5, delay: 1.5 },
  { emoji: '⚽', x: 50, y: 5, size: 40, duration: 7.5, delay: 2.5 },
  { emoji: '🏀', x: 60, y: 88, size: 54, duration: 6, delay: 4 },
  { emoji: '⚽', x: 30, y: 85, size: 44, duration: 9, delay: 0.8 },
  { emoji: '🏀', x: 82, y: 82, size: 48, duration: 7, delay: 3.5 },
  { emoji: '⚽', x: 45, y: 60, size: 56, duration: 8, delay: 1.2 },
  { emoji: '🏀', x: 25, y: 30, size: 42, duration: 6.8, delay: 2.8 },
]

export default function Landing({ onPlay }) {
  return (
    <div className={styles.wrap}>
      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className={styles.particle}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      <div className={styles.hero}>
        <div className={styles.logoWrap}>
          <img className={styles.logo} src="/logo-mark.svg" alt="Trivela logo" />
        </div>
        <p className={styles.kicker}>Sports Trivia</p>
        <h1 className={styles.title}>Trivela</h1>
        <p className={styles.tagline}>Test your knowledge. Beat your mates.</p>
        <button className={styles.playBtn} onClick={onPlay}>
          Play
        </button>
      </div>
    </div>
  )
}

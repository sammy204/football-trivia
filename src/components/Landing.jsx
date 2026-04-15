import styles from './Landing.module.css'

export default function Landing({ onPlay }) {
  return (
    <div className={styles.wrap}>
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

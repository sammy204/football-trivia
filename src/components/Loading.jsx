import styles from './Loading.module.css'

export default function Loading() {
  return (
    <div className={styles.wrap}>
      <div className={styles.ball}>⚽</div>
      <p className={styles.text}>Generating questions...</p>
    </div>
  )
}

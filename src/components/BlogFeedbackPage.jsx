import Feedback from './Feedback'
import Footer from './Footer'
import styles from './BlogHome.module.css'

export default function BlogFeedbackPage({ user, onBack, onPlayTrivela }) {
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back to Blog</button>
        <button className={styles.playBtn} onClick={onPlayTrivela}>Play Trivela</button>
      </header>

      <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 20px' }}>
        <Feedback user={user} onBack={onBack} />
      </div>

      <Footer onNavigate={(target) => handleFooterNav(target, onPlayTrivela)} context="blog" />
    </div>
  )
}

function handleFooterNav(target, onPlayTrivela) {
  if (target === 'home') {
    onPlayTrivela()
  } else if (target === 'howToPlay') {
    window.history.pushState({}, '', '/blog/how-to-play')
    window.dispatchEvent(new PopStateEvent('popstate'))
  } else if (target === 'about') {
    window.history.pushState({}, '', '/blog/about')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
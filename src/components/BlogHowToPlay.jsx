import { HOW_TO_PLAY_MODES } from '../lib/howToPlayContent'
import Footer from './Footer'
import styles from './BlogHome.module.css'

export default function BlogHowToPlay({ onBack, onPlayTrivela }) {
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back to Blog</button>
        <button className={styles.playBtn} onClick={onPlayTrivela}>Play Trivela</button>
      </header>

      <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 24 }}>
          How to Play
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {HOW_TO_PLAY_MODES.map(mode => (
            <div key={mode.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{mode.icon}</span>
              <div>
                <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>{mode.title}</p>
                <p style={{ color: 'rgba(230,240,232,0.55)', fontSize: 13.5, margin: 0, lineHeight: 1.65 }}>{mode.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer onNavigate={(target) => handleFooterNav(target, onPlayTrivela)} context="blog" />
    </div>
  )
}

function handleFooterNav(target, onPlayTrivela) {
  if (target === 'home') {
    onPlayTrivela()
  } else if (target === 'feedback') {
    window.history.pushState({}, '', '/blog/feedback')
    window.dispatchEvent(new PopStateEvent('popstate'))
  } else if (target === 'about') {
    window.history.pushState({}, '', '/blog/about')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
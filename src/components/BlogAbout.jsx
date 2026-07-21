import { ABOUT_TEXT, ABOUT_FACTS } from '../lib/aboutContent'
import Footer from './Footer'
import styles from './BlogHome.module.css'

export default function BlogAbout({ onBack, onPlayTrivela }) {
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back to Blog</button>
        <button className={styles.playBtn} onClick={onPlayTrivela}>Play Trivela</button>
      </header>

      <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <img src="/logo-mark.svg" alt="Trivela" style={{ width: 48, height: 48 }} />
          <h1 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 32, margin: 0 }}>About Trivela</h1>
        </div>
       {ABOUT_TEXT.split('\n\n').map((paragraph, i) => (
  <p key={i} style={{ color: 'rgba(230,240,232,0.6)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
    {paragraph}
  </p>
))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ABOUT_FACTS.map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: 'rgba(230,240,232,0.45)', fontSize: 13 }}>{item.label}</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <Footer onNavigate={(target) => handleFooterNav(target, onBack, onPlayTrivela)} context="blog" />
    </div>
  )
}

function handleFooterNav(target, onBack, onPlayTrivela) {
  if (target === 'home') {
    onPlayTrivela()
  } else if (target === 'feedback') {
    window.history.pushState({}, '', '/blog/feedback')
    window.dispatchEvent(new PopStateEvent('popstate'))
  } else if (target === 'howToPlay') {
    window.history.pushState({}, '', '/blog/how-to-play')
    window.dispatchEvent(new PopStateEvent('popstate'))
  } else if (target === 'about') {
    // already here
  }
}
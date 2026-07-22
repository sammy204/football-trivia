export default function Footer({ onNavigate, context = 'app' }) {
  const handleNavigate = (target) => {
    if (target === 'terms' || target === 'privacy') {
      const path = target === 'terms' ? '/blog/terms' : '/blog/privacy'
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }
    onNavigate(target)
  }

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.08)',
      marginTop: 60,
      padding: '48px 24px 24px',
      background: 'rgba(0,0,0,0.15)',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr 1fr 1fr',
        gap: 32,
        marginBottom: 40,
      }}>
        {/* Brand blurb */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <img src="/logo-mark.svg" alt="" style={{ width: 28, height: 28 }} />
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, fontFamily: 'var(--font-display)' }}>
              Trivela
            </span>
          </div>
          <p style={{ color: 'rgba(230,240,232,0.5)', fontSize: 13, lineHeight: 1.6, maxWidth: 280 }}>
            Competitive sports trivia for football and basketball fans. Quizzes, streaks, and leaderboards.
          </p>
        </div>

        {/* Navigate column */}
        <div>
          <p style={{ color: 'rgba(230,240,232,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            Navigate
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {context === 'app' && (
              <button onClick={() => handleNavigate('blog')} style={linkStyle}>Blog</button>
            )}
            {context === 'blog' && (
              <button onClick={() => handleNavigate('home')} style={linkStyle}>Play Trivela</button>
            )}
            <button onClick={() => handleNavigate('howToPlay')} style={linkStyle}>How to Play</button>
            <button onClick={() => handleNavigate('feedback')} style={linkStyle}>Feedback</button>
          </div>
        </div>

        {/* Company column */}
        <div>
          <p style={{ color: 'rgba(230,240,232,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            Company
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => handleNavigate('about')} style={linkStyle}>About Us</button>
          </div>
        </div>

        {/* Legal column */}
        <div>
          <p style={{ color: 'rgba(230,240,232,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
            Legal
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => handleNavigate('terms')} style={linkStyle}>Terms of Service</button>
            <button onClick={() => handleNavigate('privacy')} style={linkStyle}>Privacy Policy</button>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        paddingTop: 24,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{ color: 'rgba(230,240,232,0.35)', fontSize: 12, margin: 0 }}>
          © {new Date().getFullYear()} Trivela
        </p>
      </div>
    </footer>
  )
}

const linkStyle = {
  background: 'none',
  border: 'none',
  color: 'rgba(230,240,232,0.6)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
  textAlign: 'left',
}

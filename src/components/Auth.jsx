import { useState } from 'react'
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '../lib/auth'
import styles from './Auth.module.css'

export default function Auth({ onSuccess, onPlaySolo }) {
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailSubmit() {
    setError(null)
    setLoading(true)
    try {
      if (tab === 'signup') {
        if (!username.trim()) { setError('Please enter a username'); setLoading(false); return }
        if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return }
        const user = await signUpWithEmail({ username, email, password })
        onSuccess(user, 'verify')
      } else {
        const user = await signInWithEmail({ email, password })
        onSuccess(user, user.emailVerified ? 'verified' : 'unverified')
      }
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') setError('Email already in use. Please log in.')
      else if (e.code === 'auth/invalid-email') setError('Invalid email address.')
      else if (e.code === 'auth/wrong-password') setError('Incorrect password.')
      else if (e.code === 'auth/user-not-found') setError('No account found with this email.')
      else setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    try {
      const user = await signInWithGoogle()
      onSuccess(user, user.emailVerified ? 'verified' : 'unverified')
    } catch (e) {
      setError('Google sign-in failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚽</span>
          <p className={styles.logoText}>Football Trivia</p>
          <p className={styles.logoSub}>Compete. Challenge. Win.</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login' ? styles.activeTab : ''}`} onClick={() => { setTab('login'); setError(null) }}>Log In</button>
          <button className={`${styles.tab} ${tab === 'signup' ? styles.activeTab : ''}`} onClick={() => { setTab('signup'); setError(null) }}>Sign Up</button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {tab === 'signup' && (
          <>
            <label className={styles.label}>Username</label>
            <input className={styles.input} placeholder="e.g. QuizKing99" value={username} onChange={e => setUsername(e.target.value)} />
          </>
        )}

        <label className={styles.label}>Email address</label>
        <input className={styles.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />

        <label className={styles.label}>Password</label>
        <input className={styles.input} type="password" placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()} />

        <button className={styles.btnPrimary} onClick={handleEmailSubmit} disabled={loading}>
          {loading ? 'Please wait...' : tab === 'login' ? 'Log In' : 'Create Account'}
        </button>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>or</span>
          <div className={styles.dividerLine} />
        </div>

        <button className={styles.btnGoogle} onClick={handleGoogle} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className={styles.footerText}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span className={styles.footerLink} onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(null) }}>
            {tab === 'login' ? 'Sign up' : 'Log in'}
          </span>
        </p>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>or</span>
          <div className={styles.dividerLine} />
        </div>

        <button className={styles.btnSolo} onClick={onPlaySolo}>
          Play solo without account
        </button>
      </div>
    </div>
  )
}
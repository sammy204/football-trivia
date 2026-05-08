import { useState, useEffect } from 'react'
import { applyActionCode } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { signInWithGoogle } from '../lib/auth'
import Auth from './Auth'
import styles from './VerifyEmailComplete.module.css'

export default function VerifyEmailComplete({ onVerified, onPlaySolo }) {
  const [status, setStatus] = useState('loading') // loading | signed-out | unverified | verifying | success | error | already-verified
  const [error, setError] = useState(null)
  const [oobCode, setOobCode] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('oobCode')
    const mode = params.get('mode')

    if (!code || mode !== 'verifyEmail') {
      setStatus('error')
      setError('Invalid or expired verification link.')
      return
    }

    setOobCode(code)

    // Check current user state
    if (auth.currentUser) {
      if (auth.currentUser.emailVerified) {
        // Already verified — user may have clicked old link
        setStatus('already-verified')
      } else {
        // Signed in but email not verified — show manual verify button
        setStatus('unverified')
      }
    } else {
      // Not signed in
      setStatus('signed-out')
    }
  }, [])

  async function handleVerify() {
    if (!oobCode) return
    setStatus('verifying')
    try {
      await applyActionCode(auth, oobCode)
      await auth.currentUser?.reload()
      setStatus('success')
      if (onVerified) onVerified()
    } catch (err) {
      console.error('Verification failed:', err)
      setStatus('error')
      setError(err.message || 'Verification failed. The link may be expired or already used.')
    }
  }

  async function handleGoogleSignIn() {
    try {
      await signInWithGoogle()
      // After sign-in, check verification status
      await auth.currentUser?.reload()
      if (auth.currentUser?.emailVerified) {
        setStatus('already-verified')
      } else {
        setStatus('unverified')
      }
    } catch (err) {
      console.error('Sign-in failed:', err)
      setStatus('error')
      setError(err.message || 'Sign in failed. Please try again.')
    }
  }

  function handleAuthSuccess(_firebaseUser, _status) {
    // Auth component will sign in user — check verification status
    if (auth.currentUser?.emailVerified) {
      setStatus('already-verified')
    } else {
      setStatus('unverified')
    }
  }

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>⏳</div>
          <h2 className={styles.title}>Loading...</h2>
        </div>
      </div>
    )
  }

  // ── Signed out — show sign-in options ──
  if (status === 'signed-out') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>🔐</div>
          <h2 className={styles.title}>Sign in to verify</h2>
          <p className={styles.subtitle}>Sign in with the same account you used to sign up.</p>
          <Auth onSuccess={handleAuthSuccess} onPlaySolo={onPlaySolo} />
        </div>
      </div>
    )
  }

  // ── Already verified ──
  if (status === 'already-verified') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>✅</div>
          <h2 className={styles.title}>Already Verified</h2>
          <p className={styles.subtitle}>Your email is already verified. You can now start playing!</p>
          <button className={styles.btnPrimary} onClick={onPlaySolo}>
            Continue to App →
          </button>
        </div>
      </div>
    )
  }

  // ── Unverified (signed in but email not verified) — show manual verify button ──
  if (status === 'unverified') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>📧</div>
          <h2 className={styles.title}>Verify your email</h2>
          <p className={styles.subtitle}>Click below to confirm your email address.</p>
          <button className={styles.btnPrimary} onClick={handleVerify}>
            Verify Email
          </button>
          <p className={styles.resend}>
            Didn't receive the email?{' '}
            <span className={styles.link} onClick={() => window.location.reload()}>
              Resend
            </span>
          </p>
        </div>
      </div>
    )
  }

  // ── Verifying (in progress) ──
  if (status === 'verifying') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>⏳</div>
          <h2 className={styles.title}>Verifying...</h2>
          <p className={styles.subtitle}>Please wait while we confirm your email.</p>
        </div>
      </div>
    )
  }

  // ── Success ──
  if (status === 'success') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>🎉</div>
          <h2 className={styles.title}>Welcome!</h2>
          <p className={styles.subtitle}>Your email is verified. You&apos;re all set!</p>
          <button className={styles.btnPrimary} onClick={onPlaySolo}>
            Start Playing →
          </button>
        </div>
      </div>
    )
  }

  // ── Error ──
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>❌</div>
        <h2 className={styles.title}>Something went wrong</h2>
        <p className={styles.subtitle}>{error}</p>
        <button className={styles.btnPrimary} onClick={onPlaySolo}>
          Go to Home
        </button>
      </div>
    </div>
  )
}

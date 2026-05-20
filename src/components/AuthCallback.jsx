import { useState, useEffect } from 'react'
import { applyActionCode, confirmPasswordReset } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { signInWithGoogle } from '../lib/auth'
import Auth from './Auth'
import styles from './VerifyEmailComplete.module.css'
async function sendWelcomeEmail(email, displayName) {
  try {
    await fetch(`${import.meta.env.VITE_PUSH_BACKEND_URL}/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName })
    })
  } catch (err) {
    console.error('Welcome email failed:', err)
  }
}

export default function AuthCallback({ onSuccess, onPlaySolo }) {
  const [mode, setMode] = useState(null) // 'verifyEmail' | 'resetPassword' | null
  const [oobCode, setOobCode] = useState(null)
  const [status, setStatus] = useState('loading') // loading | signed-out | unverified | verifying | success | error | already-verified
  const [error, setError] = useState(null)
  // For reset password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('oobCode')
    const actionMode = params.get('mode')

    if (!code) {
      setStatus('error')
      setError('Invalid link.')
      return
    }

    setOobCode(code)

    if (actionMode === 'verifyEmail') {
      setMode('verifyEmail')
      // Check current user state
      if (auth.currentUser) {
        if (auth.currentUser.emailVerified) {
          setStatus('already-verified')
        } else {
          setStatus('unverified')
        }
      } else {
        setStatus('signed-out')
      }
    } else if (actionMode === 'resetPassword') {
      setMode('resetPassword')
      if (auth.currentUser) {
        // User already signed in — still allow reset, but show form
        setStatus('reset-form')
      } else {
        // Not signed in — still allow reset via email link
        setStatus('reset-form')
      }
    } else {
      setStatus('error')
      setError('Unknown action.')
    }
  }, [])

  // ── Verification flow ──
  async function handleVerify() {
    if (!oobCode) return
    setStatus('verifying')
    try {
     await applyActionCode(auth, oobCode)
await auth.currentUser?.reload()
setStatus('success')

// Send welcome email after verified
const user = auth.currentUser
if (user) {
  await sendWelcomeEmail(user.email, user.displayName || user.email.split('@')[0])
}

if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Verification failed:', err)
      setStatus('error')
      setError(err.message || 'Verification failed. Link may be expired or already used.')
    }
  }

  // ── Password reset flow ──
  async function handleResetSubmit(e) {
    e.preventDefault()
    if (!oobCode) return

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setStatus('verifying')
    setError(null)

    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      setStatus('success')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Password reset failed:', err)
      setStatus('error')
      setError(err.message || 'Reset failed. Link may be expired or already used.')
    }
  }

  async function handleGoogleSignIn() {
    try {
      await signInWithGoogle()
      if (mode === 'verifyEmail') {
        if (auth.currentUser?.emailVerified) {
          setStatus('already-verified')
        } else {
          setStatus('unverified')
        }
      } else {
        setStatus('reset-form')
      }
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Sign in failed.')
    }
  }

  function handleAuthSuccess() {
    if (mode === 'verifyEmail') {
      if (auth.currentUser?.emailVerified) {
        setStatus('already-verified')
      } else {
        setStatus('unverified')
      }
    } else {
      setStatus('reset-form')
    }
  }

  // ── Render: Loading ──
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

  // ── Render: Signed out (only for verifyEmail) ──
  if (status === 'signed-out' && mode === 'verifyEmail') {
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

  // ── Render: Already verified ──
  if (status === 'already-verified' && mode === 'verifyEmail') {
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

  // ── Render: Unverified — manual verify button ──
  if (status === 'unverified' && mode === 'verifyEmail') {
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
            Didn't receive it?{' '}
            <span className={styles.link} onClick={() => window.location.reload()}>
              Resend
            </span>
          </p>
        </div>
      </div>
    )
  }

  // ── Render: Reset password form ──
  if ((status === 'reset-form' || status === 'signed-out') && mode === 'resetPassword') {
    // signed-out state is treated same as reset-form for password reset (no auth needed)
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>🔒</div>
          <h2 className={styles.title}>Reset password</h2>
          <p className={styles.subtitle}>Enter your new password below.</p>

          {error && <p className={styles.errorText}>{error}</p>}

          <form onSubmit={handleResetSubmit}>
            <label className={styles.label}>New password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <label className={styles.label}>Confirm password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button className={styles.btnPrimary} type="submit">
              Reset Password
            </button>
          </form>

          <button className={styles.btnGhost} onClick={() => window.location.href = '/'}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Render: Verifying ──
  if (status === 'verifying') {
    const title = mode === 'verifyEmail' ? 'Verifying your email...' : 'Resetting password...'
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>⏳</div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>Please wait.</p>
        </div>
      </div>
    )
  }

  // ── Render: Success ──
  if (status === 'success') {
    const title = mode === 'verifyEmail' ? 'Welcome!' : 'Password reset successful'
    const subtitle = mode === 'verifyEmail' ? "Your email is verified. You're all set!" : 'You can now sign in with your new password.'
    const btnLabel = mode === 'verifyEmail' ? 'Start Playing →' : 'Sign in →'
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>🎉</div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
          <button className={styles.btnPrimary} onClick={onPlaySolo}>
            {btnLabel}
          </button>
        </div>
      </div>
    )
  }

  // ── Render: Error ──
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

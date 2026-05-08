import { useState, useEffect } from 'react'
import { confirmPasswordReset } from 'firebase/auth'
import { auth } from '../lib/firebase'
import styles from './VerifyEmailComplete.module.css'

export default function ResetPasswordComplete({ onResetSuccess }) {
  const [status, setStatus] = useState('loading') // loading | reset-form | verifying | success | error
  const [error, setError] = useState(null)
  const [oobCode, setOobCode] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('oobCode')
    const mode = params.get('mode')

    if (!code || mode !== 'resetPassword') {
      setStatus('error')
      setError('Invalid or expired reset link.')
      return
    }

    setOobCode(code)
    setStatus('reset-form')
  }, [])

  async function handleSubmit(e) {
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
      if (onResetSuccess) onResetSuccess()
    } catch (err) {
      console.error('Password reset failed:', err)
      setStatus('error')
      setError(err.message || 'Password reset failed. The link may be expired or already used.')
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

  // ── Reset form ──
  if (status === 'reset-form') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>🔒</div>
          <h2 className={styles.title}>Reset password</h2>
          <p className={styles.subtitle}>Enter your new password below.</p>

          {error && <p className={styles.errorText}>{error}</p>}

          <form onSubmit={handleSubmit}>
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

  // ── Verifying ──
  if (status === 'verifying') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>⏳</div>
          <h2 className={styles.title}>Resetting password...</h2>
          <p className={styles.subtitle}>Please wait.</p>
        </div>
      </div>
    )
  }

  // ── Success ──
  if (status === 'success') {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.icon}>✅</div>
          <h2 className={styles.title}>Password reset successful</h2>
          <p className={styles.subtitle}>You can now sign in with your new password.</p>
          <button className={styles.btnPrimary} onClick={onResetSuccess}>
            Sign in →
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
        <button className={styles.btnPrimary} onClick={() => window.location.href = '/'}>
          Go to Home
        </button>
      </div>
    </div>
  )
}

import styles from './VerifyEmail.module.css'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useState } from 'react'

export default function VerifyEmail({ user, onVerified, onPlaySolo }) {
  const [resent, setResent] = useState(false)
  const [checking, setChecking] = useState(false)

  async function handleResend() {
    try {
      await sendEmailVerification(auth.currentUser)
      setResent(true)
    } catch (e) {
      console.error('Resend failed:', e)
    }
  }

  async function handleCheckVerification() {
    setChecking(true)
    try {
      await auth.currentUser.reload()
      if (auth.currentUser.emailVerified) {
        onVerified()
      } else {
        alert('Email not verified yet. Please check your inbox.')
      }
    } catch (e) {
      console.error('Check failed:', e)
    }
    setChecking(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>📧</div>
        <h2 className={styles.title}>Check your email</h2>
        <p className={styles.subtitle}>We sent a verification link to</p>
        <div className={styles.emailBox}>{user?.email}</div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepText}>Open the email from Football Trivia</div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepText}>Click the verification link</div>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepText}>Come back and click the button below</div>
          </div>
        </div>

        <button className={styles.btnPrimary} onClick={handleCheckVerification} disabled={checking}>
          {checking ? 'Checking...' : "I've verified my email ✓"}
        </button>

        <button className={styles.btnGhost} onClick={onPlaySolo}>
          Play solo instead
        </button>

        <p className={styles.resend}>
          Didn't receive it?{' '}
          <span className={styles.resendLink} onClick={handleResend}>
            {resent ? 'Email sent!' : 'Resend email'}
          </span>
        </p>
      </div>
    </div>
  )
}
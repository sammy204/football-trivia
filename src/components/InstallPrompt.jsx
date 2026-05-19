import { useEffect, useMemo, useState } from 'react'
import styles from './InstallPrompt.module.css'

const DISMISSED_KEY = 'trivela-install-dismissed'
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

function isMobileBrowser() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function getPlatform() {
  if (typeof navigator === 'undefined') return 'other'
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'ios'
  if (/Android/i.test(navigator.userAgent)) return 'android'
  return 'other'
}

export default function InstallPrompt({ enabled }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(() => (
    typeof window !== 'undefined' &&
    Date.now() - Number(window.localStorage.getItem(DISMISSED_KEY) || 0) < DISMISS_COOLDOWN_MS
  ))
  const platform = useMemo(getPlatform, [])
  const canShow = enabled && isMobileBrowser() && !isStandaloneDisplay() && !dismissed

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
  }

  function handleContinue() {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setDismissed(true)
  }

  if (!canShow) return null

  const isAndroid = platform === 'android'
  const isIos = platform === 'ios'

  return (
    <div className={styles.overlay}>
      <section className={styles.card} aria-label="Install Trivela">
        <img src="/logo-mark.svg" alt="" className={styles.logo} />
        <p className={styles.kicker}>Install Trivela</p>
        <h2 className={styles.title}>Play it like an app</h2>
        <p className={styles.copy}>
          Add Trivela to your home screen for quicker matches, daily challenges, and invite alerts.
        </p>

        {isIos ? (
          <ol className={styles.steps}>
            <li>Tap the Share button in Safari.</li>
            <li>Choose Add to Home Screen.</li>
            <li>Open Trivela from your home screen.</li>
          </ol>
        ) : (
          <ol className={styles.steps}>
            <li>Tap Install below, or open your browser menu.</li>
            <li>Choose Install app or Add to Home screen.</li>
            <li>Open Trivela from your home screen.</li>
          </ol>
        )}

        <div className={styles.actions}>
          {isAndroid && deferredPrompt && (
            <button className={styles.installBtn} onClick={handleInstall}>
              Install app
            </button>
          )}
          <button className={styles.continueBtn} onClick={handleContinue}>
            Continue in browser
          </button>
        </div>
      </section>
    </div>
  )
}

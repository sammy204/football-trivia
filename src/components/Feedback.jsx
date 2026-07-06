import { useEffect, useState } from 'react'

const CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'Question',
  'General Feedback',
]

export default function Feedback({ user, onBack }) {
  const [category, setCategory] = useState('General Feedback')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!error) return
    const timeout = window.setTimeout(() => setError(''), 5000)
    return () => window.clearTimeout(timeout)
  }, [error])

  async function handleSubmit() {
    if (!message.trim()) return setError('Please write a message before submitting.')
    setSending(true)
    setError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_PUSH_BACKEND_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          displayName: user?.displayName || 'Anonymous',
          userId: user?.uid || null,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setSent(true)
    } catch (e) {
      setError('Something went wrong. Please try again.')
    }
    setSending(false)
  }

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'rgba(230,240,232,0.5)', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0, marginBottom: 4 }}
      >
        ← Back
      </button>

      <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#f5f5f0', letterSpacing: '0.05em', margin: 0 }}>
        Send Feedback
      </h2>
      <p style={{ color: 'rgba(230,240,232,0.45)', fontSize: 13, margin: 0 }}>
        Report a bug, request a feature, or just say hi.
      </p>

      {sent ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center',
        }}>
          <span style={{ fontSize: 48 }}>✅</span>
          <p style={{ color: '#00FF87', fontWeight: 700, fontSize: 16, margin: 0 }}>Feedback sent!</p>
          <p style={{ color: 'rgba(230,240,232,0.45)', fontSize: 13, margin: 0 }}>Thanks for helping improve Trivela.</p>
          <button
            onClick={onBack}
            style={{
              marginTop: 8, padding: '10px 24px', borderRadius: 10, background: '#00FF87',
              color: '#08180d', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: 'rgba(230,240,232,0.45)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#f5f5f0', borderRadius: 10, padding: '10px 14px', fontSize: 14,
                appearance: 'none', cursor: 'pointer', outline: 'none',
              }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c} style={{ background: '#0f2518' }}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <label style={{ color: 'rgba(230,240,232,0.45)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe the issue or idea..."
              rows={6}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#f5f5f0', borderRadius: 10, padding: '12px 14px', fontSize: 14,
                resize: 'vertical', outline: 'none', fontFamily: 'DM Sans, sans-serif',
                flex: 1,
              }}
            />
          </div>

          {error && <p style={{ color: '#ff6b6b', fontSize: 13, margin: 0 }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={sending || !message.trim()}
            style={{
              padding: '12px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 15,
              cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
              background: sending || !message.trim() ? 'rgba(255,255,255,0.05)' : '#00FF87',
              color: sending || !message.trim() ? 'rgba(230,240,232,0.3)' : '#08180d',
              transition: 'all 0.2s',
            }}
          >
            {sending ? 'Sending...' : 'Send Feedback'}
          </button>
        </>
      )}
    </div>
  )
}

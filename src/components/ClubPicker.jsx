import { useState } from 'react'
import { getClubOptions, updateUserClubs } from '../lib/clubs'

export default function ClubPicker({ user, onComplete, onSkip }) {
  const [selectedFootball, setSelectedFootball] = useState('')
  const [selectedBasketball, setSelectedBasketball] = useState('')
  const [saving, setSaving] = useState(false)

  const bothPicked = selectedFootball && selectedBasketball

  const handleSave = async () => {
    if (!bothPicked || saving) return
    setSaving(true)
    try {
      await updateUserClubs(user.uid, selectedFootball, selectedBasketball)
      onComplete?.({ football: selectedFootball, basketball: selectedBasketball })
    } catch (err) {
      console.error('Failed to save clubs:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        background: 'radial-gradient(circle at top, rgba(0,255,135,0.18), transparent 38%), rgba(4,14,8,0.94)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <section
        style={{
          width: 'min(100%, 390px)',
          padding: '24px',
          border: '1px solid rgba(0,255,135,0.24)',
          borderRadius: '16px',
          background: 'rgba(10,31,15,0.96)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
        }}
      >
        <img src="/logo-mark.svg" alt="" style={{ width: 58, height: 58, display: 'block', marginBottom: 18 }} />

        <h2
          style={{
            margin: '0 0 10px',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: 42,
            lineHeight: 0.95,
          }}
        >
          Your Club, Your Quiz
        </h2>

        <p
          style={{
            margin: '0 0 20px',
            color: 'rgba(245,245,240,0.68)',
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          Pick your clubs and we&apos;ll serve you weekly quizzes based on your teams.
        </p>

        <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                color: 'rgba(245,245,240,0.45)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              ⚽ Football Club
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedFootball}
                onChange={(e) => setSelectedFootball(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: selectedFootball
                    ? '1px solid rgba(0,255,135,0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: selectedFootball ? '#fff' : 'rgba(245,245,240,0.4)',
                  fontSize: 14,
                  fontWeight: selectedFootball ? 600 : 400,
                  appearance: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  colorScheme: 'dark',
                  transition: 'border-color 0.2s',
                }}
              >
                <option value="" disabled style={{ background: '#0a1f0f', color: 'rgba(245,245,240,0.4)' }}>
                  Select your club...
                </option>
                {getClubOptions('football').map((club) => (
                  <option key={club.id} value={club.id} style={{ background: '#0a1f0f', color: '#fff' }}>
                    {club.name}
                  </option>
                ))}
              </select>
              <svg
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'rgba(255,255,255,0.3)',
                }}
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                color: 'rgba(245,245,240,0.45)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              🏀 Basketball Team
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedBasketball}
                onChange={(e) => setSelectedBasketball(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: selectedBasketball
                    ? '1px solid rgba(0,255,135,0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: selectedBasketball ? '#fff' : 'rgba(245,245,240,0.4)',
                  fontSize: 14,
                  fontWeight: selectedBasketball ? 600 : 400,
                  appearance: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  colorScheme: 'dark',
                  transition: 'border-color 0.2s',
                }}
              >
                <option value="" disabled style={{ background: '#0a1f0f', color: 'rgba(245,245,240,0.4)' }}>
                  Select your team...
                </option>
                {getClubOptions('basketball').map((team) => (
                  <option key={team.id} value={team.id} style={{ background: '#0a1f0f', color: '#fff' }}>
                    {team.name}
                  </option>
                ))}
              </select>
              <svg
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'rgba(255,255,255,0.3)',
                }}
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={!bothPicked || saving}
            style={{
              width: '100%',
              minHeight: 46,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 900,
              cursor: bothPicked && !saving ? 'pointer' : 'not-allowed',
              border: 'none',
              background: bothPicked && !saving ? '#00FF87' : 'rgba(255,255,255,0.06)',
              color: bothPicked && !saving ? '#0a1f0f' : 'rgba(245,245,240,0.25)',
              transition: 'background 0.2s, color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {saving ? (
              <>
                <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save My Clubs 🏆'
            )}
          </button>

          <button
            onClick={onSkip}
            style={{
              width: '100%',
              minHeight: 46,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(245,245,240,0.86)',
            }}
          >
            I'll do this later
          </button>
        </div>
      </section>
    </div>
  )
}

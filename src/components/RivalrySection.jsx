// ─────────────────────────────────────────────────────────────────
// NEW FILE: src/components/RivalrySection.jsx
// Drop this file in your components folder, then import it in
// Profile.jsx and OnlineMulti.jsx
// ─────────────────────────────────────────────────────────────────

import React from 'react'

// ── FormBadge ─────────────────────────────────────────────────────
// Renders last N results as colored dots.
// Props:
//   results  – string[]  e.g. ['win','loss','win','win','draw']
//   size     – 'sm' | 'md'  (default 'md')
//   label    – optional string shown before dots
export function FormBadge({ results = [], size = 'md', label }) {
  if (!results.length) return null

  const dotSize = size === 'sm' ? 8 : 11
  const gap = size === 'sm' ? 4 : 5

  const color = {
    win:  '#00FF87',
    loss: '#FF5C5C',
    draw: 'rgba(245,245,240,0.3)',
  }

  const title = {
    win:  'Win',
    loss: 'Loss',
    draw: 'Draw',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      {label && (
        <span style={{
          fontSize: size === 'sm' ? 11 : 12,
          color: 'rgba(245,245,240,0.45)',
          fontWeight: 600,
          marginRight: 2,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      )}
    {[...results].reverse().map((r, i) => (
        <div
          key={i}
          title={title[r] || r}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: color[r] || color.draw,
            boxShadow: r === 'win'
              ? `0 0 6px ${color.win}60`
              : r === 'loss'
              ? `0 0 6px ${color.loss}40`
              : 'none',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

// ── RivalryCard ───────────────────────────────────────────────────
// Single rivalry row
function RivalryCard({ rivalry, accent = '#00FF87' }) {
  const { opponentName, played, wins, losses, draws, lastResult, iWinning, tied } = rivalry

  const statusColor = tied
    ? 'rgba(245,245,240,0.5)'
    : iWinning
    ? '#00FF87'
    : '#FF5C5C'

  const statusLabel = tied
    ? 'Even'
    : iWinning
    ? 'You lead'
    : 'They lead'

  const lastDotColor = {
    win:  '#00FF87',
    loss: '#FF5C5C',
    draw: 'rgba(245,245,240,0.3)',
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)',
      border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
      borderRadius: 14,
      padding: 13,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
    }}>
      {/* Left — name + record */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          {/* Last result indicator */}
          {lastResult && (
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: lastDotColor[lastResult] || lastDotColor.draw,
              flexShrink: 0,
            }} title={`Last match: ${lastResult}`} />
          )}
          <span style={{
            color: '#f5f5f0',
            fontWeight: 900,
            fontSize: 15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {opponentName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* W - L record */}
          <span style={{ fontSize: 13, fontWeight: 900 }}>
            <span style={{ color: '#00FF87' }}>{wins}W</span>
            <span style={{ color: 'rgba(245,245,240,0.3)', margin: '0 3px' }}>–</span>
            <span style={{ color: '#FF5C5C' }}>{losses}L</span>
            {draws > 0 && (
              <>
                <span style={{ color: 'rgba(245,245,240,0.3)', margin: '0 3px' }}>–</span>
                <span style={{ color: 'rgba(245,245,240,0.5)' }}>{draws}D</span>
              </>
            )}
          </span>
          <span style={{
            fontSize: 11,
            color: 'rgba(245,245,240,0.35)',
            fontWeight: 500,
          }}>
            {played} {played === 1 ? 'game' : 'games'}
          </span>
        </div>
      </div>

      {/* Right — status pill */}
      <div style={{
        background: `${statusColor}15`,
        border: `1px solid ${statusColor}40`,
        borderRadius: 20,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 900,
        color: statusColor,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}>
        {statusLabel}
      </div>
    </div>
  )
}

// ── RivalrySection ────────────────────────────────────────────────
// Full section for Profile page
// Props:
//   rivalries – array from getRivalries()
//   accent    – brand color string
export function RivalrySection({ rivalries = [], accent = '#00FF87' }) {
  if (!rivalries.length) {
    return (
      <section style={{
        background: 'rgba(255,255,255,0.045)',
        border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        backdropFilter: 'blur(18px)',
      }}>
        <h2 style={{
          fontSize: 11,
          fontWeight: 900,
          color: 'var(--muted, rgba(230,240,232,0.45))',
          marginBottom: 12,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
          ⚔️ Rivalries
        </h2>
        <p style={{
          color: 'rgba(245,245,240,0.4)',
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          Play online 1v1 matches to build rivalries. Your top opponents will appear here.
        </p>
      </section>
    )
  }

  return (
    <section style={{
      background: 'rgba(255,255,255,0.045)',
      border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
      borderRadius: 16,
      padding: 16,
      marginBottom: 18,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      backdropFilter: 'blur(18px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{
          fontSize: 11,
          fontWeight: 900,
          color: 'var(--muted, rgba(230,240,232,0.45))',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          ⚔️ Rivalries
        </h2>
        <span style={{
          fontSize: 11,
          color: 'rgba(245,245,240,0.35)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Most played
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rivalries.map((r, i) => (
          <RivalryCard key={r.opponentId || i} rivalry={r} accent={accent} />
        ))}
      </div>
    </section>
  )
}

// ── LobbyFormRow ──────────────────────────────────────────────────
// Used in OnlineMulti waiting screen — shows both players' form
// Props:
//   myForm       – string[]
//   opponentForm – string[]
//   myName       – string
//   opponentName – string
//   accent       – string
export function LobbyFormRow({ myForm, opponentForm, myName, opponentName, accent = '#00FF87' }) {
  if (!myForm?.length && !opponentForm?.length) return null

  return (
    <div style={{
      background: 'var(--card-bg, rgba(255,255,255,0.04))',
      border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 16,
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700,
        color: 'rgba(245,245,240,0.4)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 12,
      }}>
        Recent Form
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>{myName || 'You'}</span>
          <FormBadge results={myForm} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(245,245,240,0.2)', letterSpacing: '0.05em' }}>VS</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'rgba(245,245,240,0.7)', fontWeight: 700 }}>{opponentName || 'Opponent'}</span>
          <FormBadge results={opponentForm} />
        </div>
      </div>
    </div>
  )
}

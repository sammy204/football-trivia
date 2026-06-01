export default function AvatarFrame({ frameId, size = 56, children }) {
  if (!frameId) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        {children}
      </div>
    )
  }

  if (frameId === 'silver') {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        padding: 2,
        background: 'linear-gradient(135deg, #c0c0c0, #e8e8e8, #a8a8a8)',
        boxShadow: '0 0 8px rgba(192,192,192,0.5)',
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    )
  }

  if (frameId === 'gold') {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        padding: 2,
        background: 'linear-gradient(135deg, #f7c948, #ffe566, #c8860a)',
        boxShadow: '0 0 12px rgba(247,201,72,0.6)',
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    )
  }

  if (frameId === 'legendary') {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        padding: 2,
        background: 'conic-gradient(from 0deg, #ff5c5c, #ff9f43, #ffd700, #00ff87, #00cfff, #655dff, #ff5c5c)',
        boxShadow: '0 0 16px rgba(0,255,135,0.4)',
        animation: 'spin-frame 3s linear infinite',
      }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
      {children}
    </div>
  )
}
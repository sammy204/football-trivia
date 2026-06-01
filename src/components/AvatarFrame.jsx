const baseFrameStyle = (size) => ({
  width: size,
  height: size,
  borderRadius: '50%',
  flexShrink: 0,
})

const innerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  overflow: 'hidden',
}

export default function AvatarFrame({ frameId, size = 56, children }) {
  if (!frameId) {
    return (
      <div style={{ ...baseFrameStyle(size), overflow: 'hidden' }}>
        {children}
      </div>
    )
  }

  const frameStyles = {
    silver: {
      background: 'linear-gradient(135deg, #c0c0c0, #e8e8e8, #a8a8a8)',
      boxShadow: '0 0 8px rgba(192,192,192,0.5)',
    },
    gold: {
      background: 'linear-gradient(135deg, #f7c948, #ffe566, #c8860a)',
      boxShadow: '0 0 12px rgba(247,201,72,0.6)',
    },
    legendary: {
      background: 'conic-gradient(from 0deg, #ff5c5c, #ff9f43, #ffd700, #00ff87, #00cfff, #655dff, #ff5c5c)',
      boxShadow: '0 0 16px rgba(0,255,135,0.4)',
      animation: 'spin-frame 3s linear infinite',
    },
  }

  const frameStyle = frameStyles[frameId]
  if (!frameStyle) {
    return (
      <div style={{ ...baseFrameStyle(size), overflow: 'hidden' }}>
        {children}
      </div>
    )
  }

  return (
    <div style={{ ...baseFrameStyle(size), padding: 2, ...frameStyle }}>
      <div style={innerStyle}>
        {children}
      </div>
    </div>
  )
}

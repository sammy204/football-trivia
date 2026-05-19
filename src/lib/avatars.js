function encodeSvg(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function featureMarkup(type, colors) {
  const { body, face, accent, eye } = colors

  switch (type) {
    case 'wolf':
      return `
        <path d="M31 30 22 9l24 13M89 30 98 9 74 22" fill="${body}"/>
        <path d="M60 18c25 0 40 17 40 43 0 29-18 46-40 46S20 90 20 61c0-26 15-43 40-43z" fill="${body}"/>
        <path d="M32 31 27 19l14 9M88 31l5-12-14 9" fill="${face}"/>
      `
    case 'hood':
      return `
        <path d="M18 69c0-35 17-56 42-56s42 21 42 56v38H18z" fill="${body}"/>
        <path d="M31 66c0-22 11-36 29-36s29 14 29 36v31H31z" fill="${face}"/>
        <path d="M34 32c8-14 17-21 26-21s18 7 26 21c-8-5-17-8-26-8s-18 3-26 8z" fill="${accent}" opacity="0.35"/>
      `
    case 'flame':
      return `
        <path d="M39 43c-10 12-16 25-12 40 5 17 18 25 33 25s31-8 36-25c4-15-2-31-16-46 1 13-5 19-12 23 4-17-7-31-23-45 4 18-1 25-6 28z" fill="${body}"/>
        <path d="M47 57c-7 8-10 17-7 27 3 9 11 14 20 14s17-5 20-14c3-10-1-20-9-29-1 8-5 12-10 14 2-11-5-20-14-29 2 10 1 15 0 17z" fill="${face}"/>
      `
    case 'serpent':
      return `
        <path d="M34 30c13-16 39-16 52 0l14 18-15 53H35L20 48z" fill="${body}"/>
        <path d="M35 29c7 9 15 14 25 14s18-5 25-14c-3 18-12 29-25 29S38 47 35 29z" fill="${face}" opacity="0.35"/>
        <path d="M44 72c8 6 24 6 32 0" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
      `
    case 'robot':
      return `
        <rect x="25" y="30" width="70" height="60" rx="12" fill="${body}"/>
        <rect x="34" y="43" width="52" height="28" rx="7" fill="${face}"/>
        <path d="M45 30v-9h30v9M22 52h-8v18h8M98 52h8v18h-8" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
      `
    case 'oracle':
      return `
        <path d="M60 10 73 42l34 1-27 20 9 35-29-21-29 21 9-35-27-20 34-1z" fill="${body}"/>
        <circle cx="60" cy="58" r="30" fill="${face}" opacity="0.72"/>
      `
    case 'eagle':
      return `
        <path d="M22 44c14-20 26-25 38-11 12-14 24-9 38 11-17-5-26-2-33 8l-5 7-5-7c-7-10-16-13-33-8z" fill="${accent}"/>
        <path d="M31 55c0-19 12-32 29-32s29 13 29 32c0 28-13 51-29 51S31 83 31 55z" fill="${body}"/>
        <path d="M52 60h16l-8 10z" fill="${face}"/>
      `
    case 'shadow':
      return `
        <path d="M28 43c5-19 18-29 32-29s27 10 32 29v46c-8 12-19 18-32 18s-24-6-32-18z" fill="${body}"/>
        <path d="M32 44c11-7 24-10 38-8l18 3c-8-17-17-25-28-25-14 0-27 10-32 29z" fill="#050607"/>
      `
    case 'glacier':
      return `
        <path d="M60 9 98 76 77 108H43L22 76z" fill="${body}"/>
        <path d="M60 25 83 75 69 96H51L37 75z" fill="${face}" opacity="0.58"/>
        <path d="M60 9v99" stroke="${accent}" stroke-width="3" opacity="0.5"/>
      `
    case 'cobra':
      return `
        <path d="M24 45c4-21 18-33 36-33s32 12 36 33c-5 16-5 32 0 51H24c5-19 5-35 0-51z" fill="${body}"/>
        <path d="M43 32c5 8 11 12 17 12s12-4 17-12c-1 28-7 45-17 45S44 60 43 32z" fill="${face}" opacity="0.42"/>
      `
    case 'duke':
      return `
        <circle cx="60" cy="58" r="35" fill="${body}"/>
        <path d="M28 47c3-23 16-35 32-35s29 12 32 35c-10-7-21-10-32-10S38 40 28 47z" fill="${accent}"/>
        <path d="M24 46c4-14 9-23 16-26M96 46c-4-14-9-23-16-26" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
      `
    case 'venom':
      return `
        <path d="M28 44c7-19 18-29 32-29s25 10 32 29v63H28z" fill="${body}"/>
        <path d="M42 82c4 7 8 11 12 11M78 82c-4 7-8 11-12 11" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
        <path d="M49 98 44 113M60 99v16M71 98l5 15" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
      `
    case 'thunder':
      return `
        <path d="M31 35c8-13 18-20 29-20s21 7 29 20v52c-8 13-18 20-29 20s-21-7-29-20z" fill="${body}"/>
        <path d="M66 13 47 58h17l-10 38 24-51H60z" fill="${accent}"/>
      `
    case 'kraken':
      return `
        <circle cx="60" cy="54" r="34" fill="${body}"/>
        <path d="M32 82c-7 8-10 16-9 25M47 88c-5 7-7 15-6 25M73 88c5 7 7 15 6 25M88 82c7 8 10 16 9 25" stroke="${body}" stroke-width="9" stroke-linecap="round"/>
        <path d="M24 46c10-16 22-24 36-24s26 8 36 24c-11-6-23-9-36-9s-25 3-36 9z" fill="${face}" opacity="0.28"/>
      `
    case 'raven':
    default:
      return `
        <path d="M25 48c7-22 19-34 35-34s28 12 35 34L82 107H38z" fill="${body}"/>
        <path d="M37 36c11-9 23-13 36-11l21 7c-10-14-21-21-34-21-16 0-28 12-35 34z" fill="${face}" opacity="0.7"/>
      `
  }
}

function characterAvatar(config) {
  const colors = {
    body: config.body,
    face: config.face,
    accent: config.accent,
    eye: config.eye,
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="glow" cx="50%" cy="38%" r="65%">
          <stop offset="0" stop-color="${config.glow}" stop-opacity="0.55"/>
          <stop offset="1" stop-color="${config.bg}" stop-opacity="1"/>
        </radialGradient>
        <clipPath id="frame"><rect x="8" y="8" width="104" height="104" rx="12"/></clipPath>
      </defs>
      <rect width="120" height="120" rx="16" fill="#07140c"/>
      <rect x="8" y="8" width="104" height="104" rx="12" fill="url(#glow)"/>
      <g clip-path="url(#frame)">
        ${featureMarkup(config.type, colors)}
        <circle cx="48" cy="57" r="${config.eyeSize || 4}" fill="${config.eye}"/>
        <circle cx="72" cy="57" r="${config.eyeSize || 4}" fill="${config.eye}"/>
        <circle cx="48" cy="57" r="${(config.eyeSize || 4) + 5}" fill="${config.eye}" opacity="0.16"/>
        <circle cx="72" cy="57" r="${(config.eyeSize || 4) + 5}" fill="${config.eye}" opacity="0.16"/>
        <path d="${config.mouth || 'M51 76c6 5 12 5 18 0'}" fill="none" stroke="${config.mouthColor || config.eye}" stroke-width="4" stroke-linecap="round"/>
        <circle cx="27" cy="24" r="2" fill="${config.accent}" opacity="0.7"/>
        <circle cx="94" cy="92" r="2" fill="${config.accent}" opacity="0.45"/>
      </g>
      <rect x="8" y="8" width="104" height="104" rx="12" fill="none" stroke="${config.accent}" stroke-opacity="0.36" stroke-width="2"/>
    </svg>
  `

  return encodeSvg(svg)
}

export const GAME_AVATARS = [
  { id: 'iron-wolf', name: 'Iron Wolf', type: 'wolf', body: '#dfe7df', face: '#f4fff5', accent: '#00ff87', eye: '#ff5c5c', bg: '#092016', glow: '#173d2b', eyeSize: 3.5 },
  { id: 'phantom-keeper', name: 'Phantom Keeper', type: 'hood', body: '#171246', face: '#24206a', accent: '#655dff', eye: '#6c78ff', bg: '#0a0920', glow: '#231c70', mouth: 'M51 76h18' },
  { id: 'inferno-king', name: 'Inferno King', type: 'flame', body: '#ff5a00', face: '#ff9b21', accent: '#ffe071', eye: '#130600', bg: '#1d0700', glow: '#6d1900', eyeSize: 3 },
  { id: 'jade-serpent', name: 'Jade Serpent', type: 'serpent', body: '#00964b', face: '#00ff87', accent: '#003f26', eye: '#06150d', bg: '#062016', glow: '#0a6a3c', mouth: 'M52 76c5 3 11 3 16 0' },
  { id: 'steel-titan', name: 'Steel Titan', type: 'robot', body: '#2f536a', face: '#173247', accent: '#82b7ff', eye: '#598eff', bg: '#08141c', glow: '#1e3b52', mouth: 'M48 79h24' },
  { id: 'the-oracle', name: 'The Oracle', type: 'oracle', body: '#4c0876', face: '#260041', accent: '#c34cff', eye: '#d67bff', bg: '#130018', glow: '#3b075d', eyeSize: 3.2 },
  { id: 'storm-eagle', name: 'Storm Eagle', type: 'eagle', body: '#273045', face: '#ffcf32', accent: '#ffe66b', eye: '#5be7ff', bg: '#101421', glow: '#293557', mouth: 'M53 76h14' },
  { id: 'shadow-striker', name: 'Shadow Striker', type: 'shadow', body: '#07090a', face: '#14181b', accent: '#ff2b1f', eye: '#ff2b1f', bg: '#050505', glow: '#151719', mouth: 'M52 77c5 3 11 3 16 0' },
  { id: 'glacier', name: 'Glacier', type: 'glacier', body: '#68d9ff', face: '#dff8ff', accent: '#8eeaff', eye: '#8eeaff', bg: '#071b24', glow: '#174f65', eyeSize: 3.5 },
  { id: 'king-cobra', name: 'King Cobra', type: 'cobra', body: '#5a3b09', face: '#f7b325', accent: '#ffcd42', eye: '#ffb000', bg: '#1d1303', glow: '#5e3e09', mouth: 'M53 79c4 4 10 4 14 0' },
  { id: 'crimson-duke', name: 'Crimson Duke', type: 'duke', body: '#7d0028', face: '#bb0a3c', accent: '#ff2d65', eye: '#ff3a72', bg: '#21000a', glow: '#680021', eyeSize: 3.8 },
  { id: 'venom', name: 'Venom', type: 'venom', body: '#061108', face: '#0b1e0e', accent: '#39ff14', eye: '#39ff14', bg: '#020903', glow: '#0d3512', mouth: 'M52 76c5 4 11 4 16 0' },
  { id: 'thunder-god', name: 'Thunder God', type: 'thunder', body: '#111853', face: '#1b2473', accent: '#ffd72e', eye: '#fff06a', bg: '#060a24', glow: '#19266f', eyeSize: 3.6 },
  { id: 'the-kraken', name: 'The Kraken', type: 'kraken', body: '#00346b', face: '#0a5aa7', accent: '#138dff', eye: '#138dff', bg: '#031125', glow: '#073b78', eyeSize: 3.5 },
  { id: 'dark-raven', name: 'Dark Raven', type: 'raven', body: '#20182c', face: '#08070b', accent: '#7d4dff', eye: '#9d65ff', bg: '#09060f', glow: '#261a3b' },
].map((avatar) => ({
  ...avatar,
  src: characterAvatar(avatar),
}))

export function isImageAvatar(value) {
  return typeof value === 'string' && /^(https?:\/\/|data:image\/|\/)/.test(value)
}

export function getDefaultAvatar() {
  return GAME_AVATARS[0].src
}

export function getPlayerAvatar(user, profile) {
  if (isImageAvatar(profile?.avatar)) return profile.avatar
  if (isImageAvatar(user?.photoURL)) return user.photoURL
  return getDefaultAvatar()
}

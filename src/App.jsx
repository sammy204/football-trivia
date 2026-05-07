import { useState, useEffect } from 'react'
import Landing from './components/Landing'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Results from './components/Results'
import Loading from './components/Loading'
import OnlineMulti from './components/OnlineMulti'
import TeamMulti from './components/TeamMulti'
import InviteScreen from './components/InviteScreen'
import DailyLeaderboard from './components/DailyLeaderboard'
import Profile from './components/Profile'
import Auth from './components/Auth'
import VerifyEmail from './components/VerifyEmail'
import { generateQuestions } from './lib/question'
import {
  getDailyChallengeInfo,
  hasPlayedDailyChallenge,
  markDailyChallengePlayed,
  getDateKey,
  saveDailyLeaderboardEntry,
} from './lib/dailyChallenge'
import { loadProfile, saveProfile } from './lib/profile'
import { logOut } from './lib/auth'
import { recordDailyChallengeActivity, recordGameplayActivity, resetBrokenDailyStreak } from './lib/streaks'
import { listenToInvites } from './lib/teamMultiplayer'
import { track } from '@vercel/analytics'
import { auth } from './lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

const TEAM_ROUNDS = 10

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [questions, setQuestions] = useState([])
  const [gameConfig, setGameConfig] = useState(null)
  const [selectedSport, setSelectedSport] = useState('football')
  const [finalScores, setFinalScores] = useState([])
  const [reviewData, setReviewData] = useState([])
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(() => loadProfile())
  const [resultMeta, setResultMeta] = useState(null)
  const [saveState, setSaveState] = useState({ status: 'idle', rank: null })
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [streakNotice, setStreakNotice] = useState(null)

  // Team invite state
  const [pendingInvites, setPendingInvites] = useState([])
  const [showInvites, setShowInvites] = useState(false)
  const [teamConfig, setTeamConfig] = useState(null) // { sport, rounds, joinCode, joinTeamId }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthChecked(true)
      if (firebaseUser) {
        setScreen('home')
      }
    })
    return unsubscribe
  }, [])

  // Listen for incoming team invites
  useEffect(() => {
    if (!user?.uid) return
    const profile = loadProfile()
    const playerId = profile?.playerId
    if (!playerId) return

    const unsub = listenToInvites(playerId, (invites) => {
      setPendingInvites(invites)
      if (invites.length > 0 && screen === 'home') setShowInvites(true)
    })
    return unsub
  }, [user?.uid, screen])

  useEffect(() => {
    if (!user?.uid) return
    let active = true

    async function syncStreak() {
      try {
        const result = await resetBrokenDailyStreak({
          userId: user.uid,
          todayDateKey: getDateKey(),
        })
        if (!active || !result?.lost || !result?.previousCount) return
        const message = `Your daily streak reset after a missed day. You were on ${result.previousCount} day${result.previousCount === 1 ? '' : 's'}.`
        setStreakNotice(message)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Daily streak lost', { body: message })
        }
      } catch (error) {
        console.error('Failed to sync daily streak:', error)
      }
    }

    syncStreak()
    return () => { active = false }
  }, [user?.uid])

  useEffect(() => {
    if (!streakNotice) return
    const timeout = window.setTimeout(() => setStreakNotice(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [streakNotice])

  const sport = gameConfig?.sport || selectedSport
  const isBasketball = sport === 'basketball'
  const themeVars = isBasketball
    ? {
        '--accent': '#FF6B35',
        '--green': '#FF6B35',
        '--green-dark': '#E55A28',
        '--pitch': '#1A0E07',
        '--pitch-mid': '#2B160C',
        '--pitch-light': '#442113',
        '--card-bg': 'rgba(255,107,53,0.09)',
        '--card-border': 'rgba(255,145,89,0.18)',
        '--muted': 'rgba(255,239,230,0.6)',
      }
    : {
        '--accent': '#00FF87',
        '--green': '#00FF87',
        '--green-dark': '#00C96B',
        '--pitch': '#0a1f0f',
        '--pitch-mid': '#0f2d18',
        '--pitch-light': '#1a3d24',
        '--card-bg': 'rgba(255,255,255,0.04)',
        '--card-border': 'rgba(255,255,255,0.08)',
        '--muted': 'rgba(245,245,240,0.5)',
      }

  function handleAuthSuccess(firebaseUser, status) {
    setUser(firebaseUser)
    setShowAuth(false)
    if (status === 'verify') {
      setShowVerify(true)
    } else if (status === 'verified') {
      setScreen('home')
    } else if (status === 'unverified') {
      setShowVerify(true)
    }
  }

  function handlePlaySolo() {
    setShowAuth(false)
    setScreen('home')
  }

  async function handleLogout() {
    try {
      await logOut()
    } catch (e) {
      console.warn('Logout failed', e)
    }
    setUser(null)
  }

  async function launchGame(config) {
    setGameConfig(config)
    setSelectedSport(config.sport)
    setReviewData([])
    setResultMeta(null)
    setSaveState({ status: 'idle', rank: null })
    setScreen('loading')
    setError(null)
    track('game_started', { sport: config.sport, mode: config.mode, rounds: config.rounds })
    try {
      const qs = await generateQuestions({ rounds: config.rounds, sport: config.sport })
      setQuestions(qs)
      setScreen('quiz')
    } catch (e) {
      setError('Failed to load questions. Please try again.')
      setScreen('home')
    }
  }

  function handleStartSolo({ name, rounds, sport }) {
    launchGame({ mode: 'solo', players: [name], rounds, sport })
  }

  function handleStartOnline({ sport, rounds }) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }
    setSelectedSport(sport)
    setGameConfig({ sport, rounds })
    setScreen('online')
  }

  function handleStartTeam({ sport }) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }
    setSelectedSport(sport)
    setTeamConfig({ sport, rounds: TEAM_ROUNDS })
    setScreen('teamOnline')
  }

  function handleStartDaily({ sport }) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }

    const challenge = getDailyChallengeInfo({ sport })
    if (!challenge.available) {
      setError('Today\'s daily challenge opens at 12 PM. Please come back then.')
      return
    }

    if (hasPlayedDailyChallenge({ dateKey: challenge.dateKey, sport })) {
      setError('You have already played today\'s daily challenge. A new one drops tomorrow at 12 PM.')
      return
    }

    setSelectedSport(sport)
    setGameConfig({
      mode: 'daily',
      sport,
      rounds: challenge.rounds,
      players: [user.displayName || 'Guest'],
      challengeKey: challenge.dateKey,
    })
    setQuestions(challenge.questions)
    setReviewData([])
    setResultMeta(null)
    setSaveState({ status: 'idle', rank: null })
    setScreen('quiz')
    track('game_started', { sport, mode: 'daily', rounds: challenge.rounds })
  }

  function handleFinish({ scores, history, totalTimeMs }) {
    if (gameConfig?.mode === 'daily' && gameConfig?.challengeKey && gameConfig?.sport) {
      markDailyChallengePlayed({ dateKey: gameConfig.challengeKey, sport: gameConfig.sport })
      if (user?.uid) {
        recordDailyChallengeActivity({
          userId: user.uid,
          dateKey: gameConfig.challengeKey,
          sport: gameConfig.sport,
          score: scores[0] || 0,
        }).catch((error) => console.error('Failed to record daily challenge activity:', error))
      }
    } else if (user?.uid) {
      recordGameplayActivity({
        userId: user.uid,
        dateKey: getDateKey(),
        source: gameConfig?.mode || 'game',
      }).catch((error) => console.error('Failed to record gameplay activity:', error))
    }

    setFinalScores(scores)
    setReviewData(history)
    setResultMeta({ totalTimeMs })
    setScreen('results')
  }

  function handlePlayAgain() {
    if (gameConfig?.mode === 'daily') { setScreen('home'); return }
    launchGame(gameConfig)
  }

  async function handleSaveDailyScore(displayName) {
    if (!gameConfig || gameConfig.mode !== 'daily') return
    setSaveState({ status: 'saving', rank: null })
    setError(null)
    try {
      const nextProfile = saveProfile({ displayName })
      setProfile(nextProfile)
      const saved = await saveDailyLeaderboardEntry({
        dateKey: gameConfig.challengeKey,
        sport: gameConfig.sport,
        playerId: nextProfile.id,
        displayName: nextProfile.displayName,
        score: finalScores[0],
        totalQuestions: questions.length,
        totalTimeMs: resultMeta?.totalTimeMs || 0,
      })
      setGameConfig((current) => ({ ...current, players: [nextProfile.displayName] }))
      setSaveState({ status: 'saved', rank: saved.rank })
      track('daily_score_saved', { sport: gameConfig.sport, score: finalScores[0], rank: saved.rank })
    } catch (e) {
      setSaveState({ status: 'error', rank: null })
      setError('Could not save your daily score. Please try again.')
    }
  }

  function handleViewDailyLeaderboard(nextSport = selectedSport) {
    setSelectedSport(nextSport)
    setScreen('dailyLeaderboard')
  }

  // When a player accepts an invite, jump to the team room
  function handleInviteAccepted({ roomCode, teamId, sport }) {
    setShowInvites(false)
    setTeamConfig({ sport: sport || selectedSport, rounds: TEAM_ROUNDS, joinCode: roomCode, joinTeamId: teamId })
    setScreen('teamOnline')
  }

  if (!authChecked) return null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--pitch)',
        backgroundImage: isBasketball
          ? 'radial-gradient(circle at top, rgba(255,107,53,0.18), transparent 38%), linear-gradient(180deg, var(--pitch-mid), var(--pitch))'
          : 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.015) 60px, rgba(255,255,255,0.015) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.015) 60px, rgba(255,255,255,0.015) 61px)',
        ...themeVars,
      }}
    >
      {(error || streakNotice) && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: error ? '#FF5C5C' : '#FFB347', color: '#fff', padding: '10px 20px',
          borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999
        }}>
          {error || streakNotice}
        </div>
      )}

      {/* Invite notification badge */}
      {pendingInvites.length > 0 && screen === 'home' && !showInvites && (
        <button
          onClick={() => setShowInvites(true)}
          style={{
            position: 'fixed', top: 16, right: 16,
            background: 'var(--green)', color: 'var(--pitch)',
            border: 'none', borderRadius: 999, padding: '8px 16px',
            fontWeight: 800, fontSize: 13, cursor: 'pointer', zIndex: 998,
          }}
        >
          📨 {pendingInvites.length} Invite{pendingInvites.length > 1 ? 's' : ''}
        </button>
      )}

      {screen === 'landing' && (
        <Landing onPlay={() => setShowAuth(true)} />
      )}

      {screen === 'home' && (
        <Home
          sport={selectedSport}
          onSportChange={setSelectedSport}
          onStartSolo={handleStartSolo}
          onStartOnline={handleStartOnline}
          onStartTeam={handleStartTeam}
          onStartDaily={handleStartDaily}
          onViewDailyLeaderboard={handleViewDailyLeaderboard}
          profile={profile}
          user={user}
          onViewProfile={() => setScreen('profile')}
          onLogout={handleLogout}
        />
      )}

      {screen === 'profile' && user && (
        <Profile user={user} onBack={() => setScreen('home')} />
      )}

      {screen === 'online' && (
        <OnlineMulti
          key={user?.uid || 'guest'}
          sport={gameConfig?.sport || 'football'}
          rounds={gameConfig?.rounds || 5}
          onBack={() => setScreen('home')}
          user={user}
        />
      )}

      {screen === 'teamOnline' && (
        <TeamMulti
          key={user?.uid || 'guest'}
          sport={teamConfig?.sport || selectedSport}
          rounds={teamConfig?.rounds || TEAM_ROUNDS}
          initialJoinCode={teamConfig?.joinCode || null}
          initialJoinTeamId={teamConfig?.joinTeamId || null}
          onBack={() => setScreen('home')}
          user={user}
        />
      )}

      {screen === 'dailyLeaderboard' && (
        <DailyLeaderboard
          sport={selectedSport}
          highlightPlayerId={profile?.id}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'loading' && <Loading />}

      {screen === 'quiz' && questions.length > 0 && (
        <Quiz
          questions={questions}
          config={gameConfig}
          onFinish={handleFinish}
        />
      )}

      {screen === 'results' && (
        <Results
          scores={finalScores}
          history={reviewData}
          config={{ ...gameConfig, totalQuestions: questions.length }}
          resultMeta={resultMeta}
          profile={profile}
          saveState={saveState}
          onSaveDailyScore={handleSaveDailyScore}
          onViewDailyLeaderboard={() => handleViewDailyLeaderboard(gameConfig?.sport)}
          onHome={() => setScreen('home')}
          onPlayAgain={handlePlayAgain}
          user={user}
        />
      )}

      {showAuth && (
        <Auth
          onSuccess={handleAuthSuccess}
          onPlaySolo={handlePlaySolo}
          onClose={() => setShowAuth(false)}
        />
      )}

      {showVerify && user && (
        <VerifyEmail
          user={user}
          onVerified={() => {
            setShowVerify(false)
            setUser({ ...user, emailVerified: true })
          }}
          onPlaySolo={() => setShowVerify(false)}
        />
      )}

      {/* Team invite overlay */}
      {showInvites && (
        <InviteScreen
          invites={pendingInvites}
          user={user}
          onAccepted={handleInviteAccepted}
          onClose={() => setShowInvites(false)}
        />
      )}
    </div>
  )
}

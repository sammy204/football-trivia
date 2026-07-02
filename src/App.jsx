import React, { useState, useEffect } from 'react'
import { listenToOnlineInvite, clearOnlineInvite, joinRoom } from './lib/multiplayer'
import Admin from './components/Admin'
import Landing from './components/Landing'
import Home from './components/Home'
import MainShell from './components/MainShell'
import Quiz from './components/Quiz'
import Results from './components/Results'
import Loading from './components/Loading'
import OnlineMulti from './components/OnlineMulti'
import TeamMulti from './components/TeamMulti'
import InviteScreen from './components/InviteScreen'
import InstallPrompt from './components/InstallPrompt'
import DailyLeaderboard from './components/DailyLeaderboard'
import LightningRound from './components/LightningRound'
import LightningH2H from './components/LightningH2H'
import LightningResults from './components/LightningResults'
import LightningLeaderboard from './components/LightningLeaderboard'
import LightningModes from './components/LightningModes'
import Profile from './components/Profile'
import Auth from './components/Auth'
import VerifyEmail from './components/VerifyEmail'
import AuthCallback from './components/AuthCallback'
import Tournament from './components/Tournament'
import SeasonalQuiz from './components/SeasonalQuiz'
import SeasonalResults from './components/SeasonalResults'
import CommonLink from './components/CommonLink'
import BestOfThreeMulti from './components/BestOfThreeMulti'
import WeeklyMissions from './components/WeeklyMissions'
import { updateMissionProgress } from './lib/missions'
import { generateQuestions } from './lib/question'
import { getPlayerByPlayerId } from './lib/multiplayer'
import {
  getDailyChallengeInfo,
  hasPlayedDailyChallenge,
  markDailyChallengePlayed,
  hasPlayedDailyChallengeOnline,
  markDailyChallengePlayedOnline,
  getDateKey,
  saveDailyLeaderboardEntry,
} from './lib/dailyChallenge'
import { loadProfile, saveProfile, fetchAndCachePlayerId, fetchAndCacheProfile } from './lib/profile'
import { saveLightningScore } from './lib/lightningDaily'
import { logOut } from './lib/auth'
import { recordDailyChallengeActivity, recordGameplayActivity, resetBrokenDailyStreak, isStreakInDanger, getStreakStatus, isPast10PM } from './lib/streaks'
import { syncPublicProfile } from './lib/userStats'
import { listenToInvites } from './lib/teamMultiplayer'
import { auth } from './lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  sendLightningInvite,
  listenToLightningInvite,
  clearLightningInvite,
  startLightningGame,
  createLightningRoom,
  joinLightningRoom,
} from './lib/lightningMultiplayer'
import { sendInvitePushNotification } from './lib/inviteNotifications'
import {
  saveSeasonalLeaderboardEntry,
  getUserSeasonalEntry,
  listenToSeasonalLeaderboard,
  getSeasonalEventQuestions,
} from './lib/seasonalEvents'
import {
  awardCoins,
  ensureCoinWallet,
  LIGHTNING_H2H_WAGER,
  calculateLightningCoinReward,
  calculateQuizCoinReward,
  calculateSeasonalCoinReward,
  listenToCoinBalance,
  spendCoins,
} from './lib/coins'
import { recordModePlayed } from './lib/modeStats'
import { getPlayerAvatar } from './lib/avatars'


const TEAM_ROUNDS = 10
const INSTALL_INTEREST_KEY = 'trivela-install-interest'

function trackEvent(name, data) {
  if (!import.meta.env.PROD) return
  import('@vercel/analytics')
    .then(({ track }) => track(name, data))
    .catch(() => {})
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  componentDidCatch(error) {
    this.setState({ error: error.message })
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: 'white', padding: 40, background: '#0f1117', minHeight: '100vh' }}>
          <h2>Tournament Error:</h2>
          <pre style={{ color: '#ff4f4f', whiteSpace: 'pre-wrap' }}>{this.state.error}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [questions, setQuestions] = useState([])
  const [gameConfig, setGameConfig] = useState(null)
  const [selectedSport, setSelectedSport] = useState('football')
  const [finalScores, setFinalScores] = useState([])
  const [reviewData, setReviewData] = useState([])
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(() => loadProfile())
  const [profileState, setProfileState] = useState(() => loadProfile())
  const [activePlayerId, setActivePlayerId] = useState(() => loadProfile()?.playerId || null)
  const [resultMeta, setResultMeta] = useState(null)
  const [saveState, setSaveState] = useState({ status: 'idle', rank: null })
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [showAuthCallback, setShowAuthCallback] = useState(false)
  const [pendingInvites, setPendingInvites] = useState([])
  const [showInvites, setShowInvites] = useState(false)
  const [teamConfig, setTeamConfig] = useState(null)
  const [streakNotice, setStreakNotice] = useState(null)
  const [dailyPlayed, setDailyPlayed] = useState(false)
  const [pendingOnlineInvite, setPendingOnlineInvite] = useState(null)
  const [pendingLightningInvite, setPendingLightningInvite] = useState(null)
  const [incomingInviteForAccept, setIncomingInviteForAccept] = useState(null)
  const [onlineTargetPlayerId, setOnlineTargetPlayerId] = useState('')
  const [tournamentMatchMeta, setTournamentMatchMeta] = useState(null)
  const [activeTournamentCode, setActiveTournamentCode] = useState(null)
  const [coinBalance, setCoinBalance] = useState(0)
  const [coinReward, setCoinReward] = useState(null)
  const [mainInitialTab, setMainInitialTab] = useState('home')
  const [modeReturnTab, setModeReturnTab] = useState('home')
  const [installPromptEligible, setInstallPromptEligible] = useState(() => (
    typeof window !== 'undefined' && window.localStorage.getItem(INSTALL_INTEREST_KEY) === 'true'
  ))

  // Lightning Solo state
  const [lightningSoloQuestions, setLightningSoloQuestions] = useState([])
  const [lightningSoloConfig, setLightningSoloConfig] = useState(null)
  const [lightningSoloScores, setLightningSoloScores] = useState([])
  const [lightningSoloHistory, setLightningSoloHistory] = useState([])
  const [lightningSoloMeta, setLightningSoloMeta] = useState(null)

  // Lightning H2H state
  const [lightningH2HRoomCode, setLightningH2HRoomCode] = useState(null)
  const [lightningH2HRole, setLightningH2HRole] = useState(null)
  const [lightningH2HQuestionsHost, setLightningH2HQuestionsHost] = useState([])
  const [lightningH2HQuestionsGuest, setLightningH2HQuestionsGuest] = useState([])
  const [lightningH2HConfig, setLightningH2HConfig] = useState(null)
  const [lightningH2HFinalScores, setLightningH2HFinalScores] = useState([])
  const [lightningH2HHistory, setLightningH2HHistory] = useState([])
  const [lightningH2HMeta, setLightningH2HMeta] = useState(null)
  const [lightningH2HOpponentName, setLightningH2HOpponentName] = useState('Opponent')

  // Seasonal event state
  const [eventData, setEventData] = useState(null)
  const [seasonalQuestions, setSeasonalQuestions] = useState([])
  const [seasonalScores, setSeasonalScores] = useState([])
  const [seasonalHistory, setSeasonalHistory] = useState([])
  const [seasonalResultMeta, setSeasonalResultMeta] = useState(null)

  const ADMIN_UID = 'K4qCnBhAVDMTkvK70SMVfbbsw463'
  const [pendingRematchInvite, setPendingRematchInvite] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const actionMode = params.get('mode')
    const oobCode = params.get('oobCode')
    if ((actionMode === 'verifyEmail' || actionMode === 'resetPassword') && oobCode) {
      setShowAuthCallback(true)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthChecked(true)

      const params = new URLSearchParams(window.location.search)
      const actionMode = params.get('mode')
      const oobCode = params.get('oobCode')
      const pathname = window.location.pathname

      const isCallbackFlow =
        (pathname === '/verify-email' && oobCode) ||
        ((actionMode === 'verifyEmail' || actionMode === 'resetPassword') && oobCode)

      if (firebaseUser && !isCallbackFlow) {
        setScreen('home')
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user?.uid) {
      fetchAndCacheProfile(user.uid)
        .then((nextProfile) => {
          if (nextProfile) {
            setProfile(nextProfile)
            setProfileState(nextProfile)
            return
          }

          const cached = loadProfile()
          if (cached) {
            setProfile(cached)
            setProfileState(cached)
          }
        })
        .catch(() => {
          const cached = loadProfile()
          if (cached) {
            setProfile(cached)
            setProfileState(cached)
          }
        })
      window.localStorage.setItem(INSTALL_INTEREST_KEY, 'true')
      setInstallPromptEligible(true)
    }
  }, [user?.uid])
  
  useEffect(() => {
    if (!user?.uid) {
      setCoinBalance(0)
      return
    }ensureCoinWallet(user.uid).catch(console.error)

    return listenToCoinBalance(
      user.uid,
      setCoinBalance,
      (error) => console.error('Failed to listen to coin balance:', error)
    )
  }, [user?.uid])

  useEffect(() => {
    let mounted = true
    async function ensurePlayerId() {
      if (!user?.uid) {
        if (mounted) setActivePlayerId(null)
        return
      }
      const cached = loadProfile()?.playerId
      if (cached && mounted) setActivePlayerId(cached)
      const fromDb = await fetchAndCachePlayerId(user.uid)
      if (fromDb && mounted) setActivePlayerId(fromDb)
    }
    ensurePlayerId()
    return () => { mounted = false }
  }, [user?.uid])

  // Listen for online 1v1 invites
  useEffect(() => {
  if (!user?.uid || !activePlayerId) return
  const unsub = listenToOnlineInvite(activePlayerId, (invite) => {
     console.log('INVITE RECEIVED:', JSON.stringify(invite))
    if (invite) {
     if (invite.isBestOfThree) {
  clearOnlineInvite(activePlayerId).catch(() => {})
  setIncomingInviteForAccept(invite)
  setGameConfig({ sport: invite.sport, rounds: invite.rounds })
  setSelectedSport(invite.sport)
  setScreen('bestOfThree')
} else if (screen === 'online') {
        setPendingRematchInvite(invite)
      } else {
        setPendingOnlineInvite(invite)
      }
    } else {
      setPendingOnlineInvite(null)
      setPendingRematchInvite(null)
    }
  })
  return unsub
}, [user?.uid, activePlayerId, screen])

  // Listen for team invites globally
  useEffect(() => {
    if (!user?.uid || !activePlayerId) return
    const unsub = listenToInvites(activePlayerId, (invites) => {
      setPendingInvites(invites || [])
    })
    return unsub
  }, [user?.uid, activePlayerId])

  useEffect(() => {
    if (!user?.uid || !activePlayerId) return
    const unsub = listenToLightningInvite(activePlayerId, (invite) => {
      setPendingLightningInvite(invite || null)
    })
    return unsub
  }, [user?.uid, activePlayerId])

  // Auto-open team invite popup anywhere in-app
  useEffect(() => {
    if (pendingInvites.length > 0 && screen !== 'home') setShowInvites(true)
  }, [pendingInvites, screen])

  useEffect(() => {
    if (!user?.uid) return
    let active = true

    async function checkStreakNotifications() {
      try {
        const todayDateKey = getDateKey()
        const result = await resetBrokenDailyStreak({ userId: user.uid, todayDateKey })

        if (result?.lost && result?.previousCount) {
          if (!active) return
          const message = `💔 Your ${result.previousCount}-day streak is gone... Better luck next time!`
          setStreakNotice(message)
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Streak Lost', { body: message })
          }
          return
        }

        if (isPast10PM()) {
          const streakStatus = await getStreakStatus(user.uid)
          if (isStreakInDanger(streakStatus, todayDateKey)) {
            if (!active) return
            const days = streakStatus.current
            const message = `⚡ Your ${days}-day streak is in danger! Play any game to keep it alive before midnight.`
            setStreakNotice(message)
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Streak in Danger!', { body: message })
            }
          }
        }
      } catch (error) {
        console.error('Failed to check streak notifications:', error)
      }
    }

    checkStreakNotifications()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkStreakNotifications()
    }
    window.addEventListener('visibilitychange', handleVisibility)

    return () => {
      active = false
      window.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) { setDailyPlayed(false); return }
    async function checkPlayed() {
      try {
        const dateKey = getDateKey()
        const played = await hasPlayedDailyChallengeOnline({
          userId: user.uid,
          dateKey,
          sport: selectedSport,
        })
        setDailyPlayed(played)
      } catch {
        setDailyPlayed(false)
      }
    }
    checkPlayed()
  }, [user?.uid, selectedSport])

  useEffect(() => {
    if (!user?.uid) return
    const displayName = profile?.displayName || user.displayName || 'Player'
    syncPublicProfile(user.uid, displayName).catch(() => {})
  }, [user?.uid, profile?.displayName, user?.displayName])

  useEffect(() => {
    if (!streakNotice) return
    const timeout = window.setTimeout(() => setStreakNotice(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [streakNotice])

  const sport = screen === 'home' ? selectedSport : gameConfig?.sport || selectedSport
  const isBasketball = sport === 'basketball'
  const accent = isBasketball ? '#FF6B35' : '#00FF87'
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
        '--pitch': '#08180d',
        '--pitch-mid': '#0f2518',
        '--pitch-light': '#1a3a24',
        '--card-bg': 'rgba(255,255,255,0.04)',
        '--card-border': 'rgba(255,255,255,0.08)',
        '--muted': 'rgba(230,240,232,0.45)',
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

  function handleAuthCallbackSuccess() {
    setShowAuthCallback(false)
    setScreen('home')
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  function handlePlaySoloFromAuthCallback() {
    setShowAuthCallback(false)
    setScreen('home')
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  function handlePlaySolo() {
    setShowAuth(false)
    setScreen('home')
  }

  function handleProfileUpdated(nextProfile) {
    setProfile(nextProfile)
    setProfileState(nextProfile)
  }

  async function handleLogout() {
    try {
      await logOut()
    } catch (e) {
      console.warn('Logout failed', e)
    }
    setUser(null)
    setScreen('landing')
  }

  async function launchGame(config) {
    window.localStorage.setItem(INSTALL_INTEREST_KEY, 'true')
    setInstallPromptEligible(true)
    setGameConfig(config)
    setSelectedSport(config.sport)
    setReviewData([])
    setResultMeta(null)
    setCoinReward(null)
    setSaveState({ status: 'idle', rank: null })
    setScreen('loading')
    setError(null)
    trackEvent('game_started', { sport: config.sport, mode: config.mode, rounds: config.rounds })
    try {
      const qs = await generateQuestions({ rounds: config.rounds, sport: config.sport })
      setQuestions(qs)
      setScreen('quiz')
    } catch (e) {
      setError('Failed to load questions. Please try again.')
      setScreen('home')
    }
  }

  function recordMode(mode) {
    if (!user?.uid) return
    recordModePlayed(user.uid, mode).catch((error) => {
      console.error('Failed to record mode count:', error)
    })
  }

  function rememberModeReturnTab(returnTab = 'home') {
    setModeReturnTab(returnTab || 'home')
  }

  function returnToMainTab(tab = modeReturnTab) {
    setMainInitialTab(tab || 'home')
    setScreen('home')
  }

  function handleStartSolo({ name, rounds, sport, returnTab = 'home' }) {
    rememberModeReturnTab(returnTab)
    recordMode('solo')
    launchGame({ mode: 'solo', players: [name], rounds, sport })
  }

  function handleStartOnline({ sport, rounds, returnTab = 'home', opponentPlayerId = '' }) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }
    rememberModeReturnTab(returnTab)
    recordMode('online')
    setSelectedSport(sport)
    setOnlineTargetPlayerId(String(opponentPlayerId || '').trim().toUpperCase())
    setGameConfig({ sport, rounds })
    setScreen('online')
  }

  function handleStartTeam({ sport, returnTab = 'home', opponentPlayerId = '' }) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }
    rememberModeReturnTab(returnTab)
    recordMode('team')
    setSelectedSport(sport)
    setTeamConfig({
      sport,
      rounds: TEAM_ROUNDS,
      prefillInvitePlayerId: String(opponentPlayerId || '').trim().toUpperCase(),
    })
    setScreen('teamOnline')
  }

  function handleStartLightning({ sport, returnTab = 'home' }) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }
    rememberModeReturnTab(returnTab)
    recordMode('lightning')
    setSelectedSport(sport)
    setScreen('lightningModes')
  }

  // FIX: added async
  function handleStartTournament({ returnTab = 'home' } = {}) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }
    rememberModeReturnTab(returnTab)
    recordMode('tournament')
    setScreen('tournament')
  }
function handleStartCommonLink({ sport, returnTab = 'home' }) {
  if (!user) { setShowAuth(true); return }
  if (!user.emailVerified) { setShowVerify(true); return }
  rememberModeReturnTab(returnTab)
  recordMode('commonLink')
  setSelectedSport(sport)
  setScreen('commonLink')
}
function handleStartBestOfThree({ sport, rounds, returnTab = 'home' }) {
  if (!user) { setShowAuth(true); return }
  if (!user.emailVerified) { setShowVerify(true); return }
  rememberModeReturnTab(returnTab)
  recordMode('bestOfThree')
  setSelectedSport(sport)
  setGameConfig({ sport, rounds })
  setScreen('bestOfThree')
}

  async function awardUserCoins({ amount, reason, sourceId, metadata, label, detail }) {
    if (!user?.uid) {
      return {
        amount: 0,
        label: 'Coins not saved',
        detail: 'Sign in before playing to earn coins.',
        muted: true,
      }
    }

    if (amount <= 0) return null

    try {
      const awarded = await awardCoins({
        userId: user.uid,
        amount,
        reason,
        sourceId,
        metadata,
      })

      if (!awarded.ok) return null

      setCoinBalance(awarded.balance)
      return {
        amount: awarded.amount || amount,
        label,
        detail,
      }
    } catch (error) {
      console.error('Failed to award coins:', error)
      return {
        amount: 0,
        label: 'Coins not saved',
        detail: 'The wallet update failed. Please try again.',
        muted: true,
      }
    }
  }

  function handleTournamentMatch({ roomCode, sport, rounds }) {
    setTournamentMatchMeta({ roomCode })
    setGameConfig({ sport, rounds })
    setScreen('tournamentMatch')
  }

  // FIX: was missing async
  async function handleStartLightningSolo({ sport }) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }
    recordMode('lightning_solo')
    setSelectedSport(sport)
    setLightningSoloConfig({ sport, mode: 'solo' })
    setLightningSoloHistory([])
    setLightningSoloMeta(null)
    setLightningSoloScores([])
    setError(null)
    trackEvent('game_started', { sport, mode: 'lightning_solo' })
    try {
      const qs = await generateQuestions({ rounds: 50, sport })
      setLightningSoloQuestions(qs)
      setScreen('lightningSolo')
    } catch (e) {
      setError('Failed to load questions. Please try again.')
      setScreen('home')
    }
  }

  async function handleStartLightningH2H({ sport, opponentPlayerId }) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }
    const targetPlayerId = opponentPlayerId.trim().toUpperCase()
    const myPlayerId = String(loadProfile()?.playerId || activePlayerId || '').trim().toUpperCase()

    if (targetPlayerId && myPlayerId && targetPlayerId === myPlayerId) {
      setError('You cannot invite yourself.')
      return
    }

    recordMode('lightning_h2h')
    setSelectedSport(sport)
    setLightningH2HConfig({ sport, mode: 'h2h', wager: LIGHTNING_H2H_WAGER })

    try {
      const opponent = await getPlayerByPlayerId(targetPlayerId)
      if (!opponent) {
        setError('Player ID not found.')
        return
      }

      const stake = await spendCoins({
        userId: user.uid,
        amount: LIGHTNING_H2H_WAGER,
        reason: 'lightning_h2h_stake',
        sourceId: `lightning-stake-host:${Date.now()}:${user.uid}`,
        metadata: { sport },
      })
      if (!stake.ok) {
        setError(`You need ${LIGHTNING_H2H_WAGER} coins to start a Lightning Duel.`)
        return
      }

      const questionsHost = await generateQuestions({ rounds: 50, sport })
      const questionsGuest = await generateQuestions({ rounds: 50, sport })
      setLightningH2HQuestionsHost(questionsHost)
      setLightningH2HQuestionsGuest(questionsGuest)

      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      // FIX: removed require(), using top-level import
      await createLightningRoom({
        playerName: user.displayName || 'Player',
        sport,
        rounds: 50,
        code: roomCode,
        hostUid: user.uid,
        wager: LIGHTNING_H2H_WAGER,
      })

      await sendLightningInvite({
        fromName: user.displayName || 'Player',
        fromUserId: user.uid,
        toPlayerId: targetPlayerId,
        roomCode,
        sport,
      })
      try {
        await sendInvitePushNotification({
          toUserId: opponent.uid,
          fromName: user.displayName || 'Player',
          roomCode,
          sport,
          type: 'lightning1v1',
        })
      } catch (pushError) {
        console.warn('Lightning push notification failed, invite still sent:', pushError)
      }

      setLightningH2HRoomCode(roomCode)
      setLightningH2HRole('host')
      setScreen('lightningH2H')
    } catch (e) {
      setError('Failed to create room: ' + e.message)
      setScreen('home')
    }
  }

  // Seasonal event handler
  async function handleStartSeasonalEvent({
    eventId,
    eventName,
    sport,
    dailyQuestions,
    questions,
    coinMultiplier = 1,
    entryFee = 0,
    returnTab = 'home',
  }) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }
    rememberModeReturnTab(returnTab)
    recordMode('seasonal')

    const eventQuestions = Array.isArray(questions) && questions.length > 0
      ? questions
      : await getSeasonalEventQuestions({
        sport: sport || selectedSport,
        rounds: dailyQuestions || 10,
      })

    if (eventQuestions.length === 0) {
      setError('This seasonal event has no questions yet. Add questions in Admin > Questions > Seasonal Event.')
      return
    }

    const fee = Math.max(0, Math.round(Number(entryFee) || 0))
    if (fee > 0) {
      let spent
      try {
        spent = await spendCoins({
          userId: user.uid,
          amount: fee,
          reason: 'seasonal_entry',
          sourceId: `seasonal-entry:${eventId}:${user.uid}`,
          metadata: {
            eventId,
            eventName,
            sport: sport || selectedSport,
          },
        })
      } catch (error) {
        console.error('Failed to spend seasonal entry coins:', error)
        setError('Could not process event entry coins. Please try again.')
        return
      }

      if (!spent.ok) {
        setCoinBalance(spent.balance)
        setError(`You need ${fee} coins to enter this event.`)
        return
      }
      setCoinBalance(spent.balance)
    }
    
    setEventData({
      eventId,
      eventName,
      sport: sport || selectedSport,
      dailyQuestions,
      questions: eventQuestions,
      coinMultiplier,
      entryFee: fee,
    })
    setSeasonalQuestions(eventQuestions)
    setSeasonalScores([])
    setSeasonalHistory([])
    setSeasonalResultMeta(null)
    setCoinReward(null)
    setScreen('seasonalQuiz')
  }

  async function handleFinishSeasonalQuiz({ scores, history, totalTimeMs }) {
    if (user?.uid) {
      recordGameplayActivity({
        userId: user.uid,
        dateKey: getDateKey(),
        source: 'seasonal',
      }).catch((error) => console.error('Failed to record gameplay activity:', error))
    }

    const rewardAmount = calculateSeasonalCoinReward({
      score: scores[0],
      totalQuestions: history.length,
      multiplier: eventData?.coinMultiplier,
    })
    const reward = await awardUserCoins({
      amount: rewardAmount,
      reason: 'seasonal_reward',
      sourceId: `seasonal-reward:${eventData?.eventId}:${user?.uid}`,
      metadata: {
        eventId: eventData?.eventId,
        eventName: eventData?.eventName,
        score: scores[0],
        totalQuestions: history.length,
        multiplier: eventData?.coinMultiplier || 1,
      },
      label: 'Seasonal coins earned',
      detail: `${eventData?.coinMultiplier || 1}x event multiplier`,
    })

    setCoinReward(reward)
    setSeasonalScores(scores)
    setSeasonalHistory(history)
    setSeasonalResultMeta({ totalTimeMs })
    setScreen('seasonalResults')
  }

  function handlePlaySeasonalAgain() {
    handleStartSeasonalEvent(eventData)
  }

  async function handleAcceptLightningInvite(invite) {
    try {
      recordMode('lightning_h2h')
      const sport = invite.sport
      const stake = await spendCoins({
        userId: user.uid,
        amount: LIGHTNING_H2H_WAGER,
        reason: 'lightning_h2h_stake',
        sourceId: `lightning-stake-guest:${invite.roomCode}:${user.uid}`,
        metadata: { sport },
      })
      if (!stake.ok) {
        setError(`You need ${LIGHTNING_H2H_WAGER} coins to accept this Lightning Duel.`)
        return
      }

      const questionsGuest = await generateQuestions({ rounds: 50, sport })
      setLightningH2HQuestionsGuest(questionsGuest)
      setLightningH2HConfig({ sport, mode: 'h2h', wager: LIGHTNING_H2H_WAGER })

      await joinLightningRoom({
        code: invite.roomCode,
        playerName: user.displayName || 'Guest',
        guestUid: user.uid,
      })

      setLightningH2HRoomCode(invite.roomCode)
      setLightningH2HRole('guest')
      await clearLightningInvite(activePlayerId)
      setPendingLightningInvite(null)
      setScreen('lightningH2H')
    } catch (e) {
      setError('Failed to join room: ' + e.message)
    }
  }

  function handleDeclineLightningInvite() {
    clearLightningInvite(activePlayerId).catch(() => {})
    setPendingLightningInvite(null)
  }

  async function handleFinishLightningSolo({ scores, history, totalTimeMs, totalQuestions }) {
    const correctCount = history.filter(item => item.isCorrect).length
    const rewardAmount = calculateLightningCoinReward({ correctAnswers: correctCount })
    const reward = await awardUserCoins({
      amount: rewardAmount,
      reason: 'lightning_solo_reward',
      sourceId: `lightning-solo:${lightningSoloConfig?.sport || selectedSport}:${totalQuestions}:${totalTimeMs}:${user?.uid}`,
      metadata: {
        sport: lightningSoloConfig?.sport,
        correctAnswers: correctCount,
        totalQuestions,
        totalTimeMs,
      },
      label: 'Lightning coins earned',
      detail: `${correctCount} correct answers`,
    })

    setCoinReward(reward)
    setLightningSoloScores(scores)
    setLightningSoloHistory(history)
    setLightningSoloMeta({ totalTimeMs, totalQuestions })
    if (user?.uid) {
      const prof = profile || loadProfile()
      const playerId = prof?.playerId || user.uid
      const displayName = user.displayName || prof?.displayName || 'Anonymous'
      saveLightningScore({
        sport: lightningSoloConfig.sport,
        playerId,
        displayName,
        avatar: getPlayerAvatar(user, prof),
        score: scores[0],
        totalQuestions,
        totalTimeMs,
        correctAnswers: correctCount,
      }).catch(e => console.error('Failed to save lightning score:', e))
    }
    setScreen('lightningSoloResults')
  }

  async function handleFinishLightningH2H({ scores, history, totalTimeMs, totalQuestions, isWin, isDraw, opponentName }) {
    const pot = (lightningH2HConfig?.wager || LIGHTNING_H2H_WAGER) * 2
    if (isWin) {
      const reward = await awardUserCoins({
        amount: pot,
        reason: 'lightning_h2h_payout',
        sourceId: `lightning-h2h-payout:${lightningH2HRoomCode}:${user?.uid}`,
        metadata: {
          sport: lightningH2HConfig?.sport,
          score: scores[0],
          opponentScore: scores[1],
          isWin,
          totalQuestions,
          totalTimeMs,
        },
        label: 'Duel pot won',
        detail: `Winner takes the ${pot}-coin pot`,
      })
      setCoinReward(reward)
    } else if (isDraw) {
      const refund = await awardUserCoins({
        amount: lightningH2HConfig?.wager || LIGHTNING_H2H_WAGER,
        reason: 'lightning_h2h_draw_refund',
        sourceId: `lightning-h2h-refund:${lightningH2HRoomCode}:${user?.uid}`,
        metadata: {
          sport: lightningH2HConfig?.sport,
          score: scores[0],
          opponentScore: scores[1],
        },
        label: 'Duel stake refunded',
        detail: 'Draw result returns your entry stake',
      })
      setCoinReward(refund)
    } else {
      setCoinReward({
        amount: 0,
        label: 'Duel stake lost',
        detail: `${lightningH2HConfig?.wager || LIGHTNING_H2H_WAGER} coins went to the winner`,
        muted: true,
      })
    }
    setLightningH2HFinalScores(scores)
    setLightningH2HHistory(history)
    setLightningH2HMeta({ totalTimeMs, totalQuestions, isWin, isDraw })
    setLightningH2HOpponentName(opponentName)

    if (user?.uid && isWin) {
  updateMissionProgress(user.uid, 'lightningWin').catch(() => {})
}

    if (user?.uid) {
      const prof = profile || loadProfile()
      const playerId = prof?.playerId || user.uid
      const displayName = user.displayName || prof?.displayName || 'Anonymous'
      saveLightningScore({
        sport: lightningH2HConfig.sport,
        playerId,
        displayName,
        avatar: getPlayerAvatar(user, prof),
        score: scores[0],
        totalQuestions,
        totalTimeMs,
        correctAnswers: scores[0],
      }).catch(e => console.error('Failed to save lightning score:', e))
    }

    setScreen('lightningH2HResults')
  }

  // FIX: was missing async
  async function handlePlayLightningSoloAgain() {
    setLightningSoloHistory([])
    setLightningSoloMeta(null)
    setLightningSoloScores([])
    try {
      const qs = await generateQuestions({ rounds: 50, sport: lightningSoloConfig?.sport || selectedSport })
      setLightningSoloQuestions(qs)
      setScreen('lightningSolo')
    } catch (e) {
      setError('Failed to load questions.')
      setScreen('home')
    }
  }

  function handlePlayLightningH2HAgain() {
    setLightningH2HHistory([])
    setLightningH2HMeta(null)
    setLightningH2HFinalScores([])
    setLightningH2HRoomCode(null)
    setLightningH2HRole(null)
    setScreen('lightningModes')
  }

  function handleViewLightningLeaderboard(nextSport = selectedSport) {
    setSelectedSport(nextSport)
    setScreen('lightningLeaderboard')
  }

  // FIX: was missing async
  async function handleStartDaily({ sport, returnTab = 'home' }) {
    if (!user) { setShowAuth(true); return }
    if (!user.emailVerified) { setShowVerify(true); return }
    rememberModeReturnTab(returnTab)
    recordMode('daily')

    let challenge
    try {
      challenge = await getDailyChallengeInfo({ sport })
    } catch (e) {
      setError('Failed to load daily challenge. Please try again.')
      return
    }

    if (!challenge.available) {
      setError("Today's daily challenge opens at 12 PM. Please come back then.")
      return
    }

    const playedOnline = await hasPlayedDailyChallengeOnline({
      userId: user.uid,
      dateKey: challenge.dateKey,
      sport,
    })

    if (playedOnline) {
      markDailyChallengePlayed({ dateKey: challenge.dateKey, sport })
      setError("You have already played today's daily challenge. A new one drops tomorrow at 12 PM.")
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
    trackEvent('game_started', { sport, mode: 'daily', rounds: challenge.rounds })
  }

  async function handleFinish({ scores, history, totalTimeMs }) {
    if (gameConfig?.mode === 'daily' && gameConfig?.challengeKey && gameConfig?.sport) {
      markDailyChallengePlayed({ dateKey: gameConfig.challengeKey, sport: gameConfig.sport })
      if (user?.uid) {
        markDailyChallengePlayedOnline({
          userId: user.uid,
          dateKey: gameConfig.challengeKey,
          sport: gameConfig.sport,
        }).catch((error) => console.error('Failed to mark daily played online:', error))

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
    if (user?.uid && gameConfig?.mode === 'solo') {
  updateMissionProgress(user.uid, 'solo').catch(() => {})
}
if (user?.uid && gameConfig?.mode === 'daily' && scores[0] === history.length) {
  updateMissionProgress(user.uid, 'perfectDaily').catch(() => {})
}

    const rewardAmount = calculateQuizCoinReward({
      mode: gameConfig?.mode,
      score: scores[0],
      totalQuestions: history.length,
    })
    const reward = await awardUserCoins({
      amount: rewardAmount,
      reason: gameConfig?.mode === 'daily' ? 'daily_reward' : 'quiz_reward',
      sourceId: gameConfig?.mode === 'daily'
        ? `daily_reward:${gameConfig?.challengeKey}:${user?.uid}`
        : `${gameConfig?.mode || 'quiz'}:${gameConfig?.challengeKey || Date.now()}:${Date.now()}`,
      metadata: {
        sport: gameConfig?.sport,
        mode: gameConfig?.mode,
        score: scores[0],
        totalQuestions: history.length,
        totalTimeMs,
      },
      label: gameConfig?.mode === 'daily' ? 'Daily coins earned' : 'Coins earned',
      detail: gameConfig?.mode === 'daily' ? 'Daily challenge pays 2x' : 'Correct answers plus perfect bonus',
    })

    setCoinReward(reward)
    setFinalScores(scores)
    setReviewData(history)
    setResultMeta({ totalTimeMs })
    setScreen('results')
  }

  function handlePlayAgain() {
    if (gameConfig?.mode === 'daily') { setScreen('home'); return }
    launchGame(gameConfig)
  }

  async function handleSaveDailyScore(displayName, totalTimeMs, totalQuestions) {
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
        avatar: getPlayerAvatar(user, nextProfile),
        score: finalScores[0],
        totalQuestions: totalQuestions ?? questions.length,
        totalTimeMs: totalTimeMs ?? 0,
      })
      setGameConfig((current) => ({ ...current, players: [nextProfile.displayName] }))
      setSaveState({ status: 'saved', rank: saved.rank })
      trackEvent('daily_score_saved', { sport: gameConfig.sport, score: finalScores[0], rank: saved.rank })
    } catch (e) {
      setSaveState({ status: 'error', rank: null })
      setError('Could not save your daily score. Please try again.')
    }
  }

  function handleViewDailyLeaderboard(nextSport = selectedSport) {
    setSelectedSport(nextSport)
    setScreen('dailyLeaderboard')
  }

 async function handleAcceptOnlineInvite() {
  if (!pendingOnlineInvite) return
  const prof = loadProfile()
  const inviteData = pendingOnlineInvite
  setSelectedSport(inviteData.sport)
  setGameConfig({ sport: inviteData.sport, rounds: inviteData.rounds })
  await clearOnlineInvite(prof?.playerId)
  setPendingOnlineInvite(null)
  setIncomingInviteForAccept(inviteData)
  if (inviteData.isBestOfThree) {
    setScreen('bestOfThree')
  } else {
    setScreen('online')
  }
}

  async function handleDeclineOnlineInvite() {
    const prof = loadProfile()
    await clearOnlineInvite(prof?.playerId)
    setPendingOnlineInvite(null)
  }

  function handleInviteAccepted({ roomCode, teamId, sport }) {
    setShowInvites(false)
    setTeamConfig({ sport: sport || selectedSport, rounds: TEAM_ROUNDS, joinCode: roomCode, joinTeamId: teamId })
    setScreen('teamOnline')
  }

  const params = new URLSearchParams(window.location.search)
  const hasOobCode = params.get('oobCode')

  if (!authChecked && !hasOobCode) return (
    <div style={{
      minHeight: '100vh',
      background: '#0a1f0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
    }}>
      <img
        src="/logo-mark.svg"
        alt="Trivela"
        style={{
          width: 80,
          height: 80,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <p style={{
        color: '#00FF87',
        fontFamily: 'sans-serif',
        fontWeight: 800,
        fontSize: 22,
        letterSpacing: 1,
        margin: 0,
      }}>Trivela</p>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
      `}</style>
    </div>
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--pitch)',
        backgroundImage: isBasketball
          ? 'radial-gradient(circle at 50% 0%, rgba(255,107,53,0.18), transparent 36%), linear-gradient(180deg, var(--pitch-mid), var(--pitch) 42%)'
          : 'radial-gradient(circle at 50% 0%, rgba(0,255,135,0.13), transparent 36%), linear-gradient(180deg, var(--pitch-mid), var(--pitch) 42%)',
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

      {pendingInvites.length > 0 && !showInvites && screen !== 'home' && (
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

      {pendingOnlineInvite && screen !== 'home' && (
        <div style={{
          position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
          background: '#0f2d18', border: '1px solid rgba(0,255,135,0.2)',
          borderRadius: 12, padding: '16px 20px', zIndex: 998,
          width: 'calc(100% - 32px)', maxWidth: 380,
        }}>
          <p style={{ color: '#fff', fontWeight: 700, marginBottom: 4 }}>
            📨 {pendingOnlineInvite.fromName} challenged you to a 1v1!
          </p>
          <p style={{ color: 'rgba(245,245,240,0.5)', fontSize: 13, marginBottom: 12 }}>
            {pendingOnlineInvite.rounds} questions · {pendingOnlineInvite.sport}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
           onClick={async () => {
            const prof = loadProfile()
            const inviteData = pendingOnlineInvite
            setSelectedSport(inviteData.sport)
            setGameConfig({ sport: inviteData.sport, rounds: inviteData.rounds })
            await clearOnlineInvite(prof?.playerId)
            setPendingOnlineInvite(null)
            setIncomingInviteForAccept(inviteData)
            if (inviteData.isBestOfThree) {
              setScreen('bestOfThree')
            } else {
              setScreen('online')
            }
          }}
              style={{
                flex: 1, background: '#00FF87', color: '#0a1f0f',
                border: 'none', borderRadius: 8, padding: '10px',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Accept
            </button>
            <button
              onClick={async () => {
                const prof = loadProfile()
                await clearOnlineInvite(prof?.playerId)
                setPendingOnlineInvite(null)
              }}
              style={{
                flex: 1, background: 'transparent', color: '#FF5C5C',
                border: '1px solid #FF5C5C', borderRadius: 8, padding: '10px',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {pendingLightningInvite && screen !== 'home' && (
        <div style={{
          position: 'fixed', top: 120, left: '50%', transform: 'translateX(-50%)',
          background: isBasketball ? 'rgba(255,107,53,0.95)' : '#0f2d18',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 12, padding: '16px 20px', zIndex: 998,
          width: 'calc(100% - 32px)', maxWidth: 380,
        }}>
          <p style={{ color: '#fff', fontWeight: 700, marginBottom: 4 }}>
            ⚡ {pendingLightningInvite.fromName} challenged you to a Lightning Duel!
          </p>
          <p style={{ color: 'rgba(245,245,240,0.5)', fontSize: 13, marginBottom: 12 }}>
            60 seconds · {pendingLightningInvite.sport}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={async () => {
                await handleAcceptLightningInvite(pendingLightningInvite)
              }}
              style={{
                flex: 1, background: accent, color: '#fff',
                border: 'none', borderRadius: 8, padding: '10px',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Accept
            </button>
            <button
              onClick={handleDeclineLightningInvite}
              style={{
                flex: 1, background: 'transparent', color: '#FF5C5C',
                border: '1px solid #FF5C5C', borderRadius: 8, padding: '10px',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {screen === 'landing' && !showAuthCallback && <Landing onPlay={() => setShowAuth(true)} />}

      {screen === 'home' && (
        <MainShell
          initialTab={mainInitialTab}
          sport={selectedSport}
          onSportChange={setSelectedSport}
          user={user}
          profile={profileState || profile}
          coinBalance={coinBalance}
          dailyPlayed={dailyPlayed}
          pendingOnlineInvite={pendingOnlineInvite}
          pendingInvites={pendingInvites}
          pendingLightningInvite={pendingLightningInvite}
          streakNotice={streakNotice}
          onStartSolo={handleStartSolo}
          onStartOnline={handleStartOnline}
          onStartTeam={handleStartTeam}
          onStartDaily={handleStartDaily}
          onStartTournament={handleStartTournament}
          onStartLightning={handleStartLightning}
          onStartLightningH2H={handleStartLightningH2H}
          onStartSeasonalEvent={handleStartSeasonalEvent}
          onStartCommonLink={handleStartCommonLink}
          onStartBestOfThree={handleStartBestOfThree}
          onWeeklyMissions={() => setScreen('weeklyMissions')}
            onCoinsUpdated={() => {}}
          onAcceptOnlineInvite={handleAcceptOnlineInvite}
          onDeclineOnlineInvite={handleDeclineOnlineInvite}
          onAcceptTeamInvite={handleInviteAccepted}
          onDeclineTeamInvite={() => {}}
          onAcceptLightningInvite={() => pendingLightningInvite && handleAcceptLightningInvite(pendingLightningInvite)}
          onDeclineLightningInvite={handleDeclineLightningInvite}
          onAdmin={() => setScreen('admin')}
          onEditProfile={() => {
            setMainInitialTab('profile')
            setScreen('profile')
          }}
          onUsernameUpdated={(newName) => setUser({ ...user, displayName: newName })}
          onProfileUpdated={handleProfileUpdated}
          onLogout={handleLogout}
          isAdmin={user?.uid === ADMIN_UID}
        />
      )}

      {screen === 'admin' && (
        <Admin
          user={user}
          onBack={() => {
            setMainInitialTab('profile')
            setScreen('home')
          }}
        />
      )}

      {screen === 'profile' && user && (
        <Profile
          user={user}
          onBack={() => {
            setMainInitialTab('profile')
            setScreen('home')
          }}
          onUsernameUpdated={(newName) => setUser({ ...user, displayName: newName })}
          onProfileUpdated={handleProfileUpdated}
          onLogout={handleLogout}
          coinBalance={coinBalance}
          onAdmin={() => setScreen('admin')}
          isAdmin={user?.uid === ADMIN_UID}
        />
      )}

      {screen === 'online' && (
        <OnlineMulti
          key={user?.uid || 'guest'}
          sport={gameConfig?.sport || 'football'}
          rounds={gameConfig?.rounds || 5}
          initialOpponentPlayerId={onlineTargetPlayerId}
          onBack={() => {
          if (user?.uid) {
            updateMissionProgress(user.uid, 'online').catch(() => {})
          }
          returnToMainTab()
        }}
        onMatchResult={async ({ result }) => {
  if (!user?.uid) return
  try {
    const { get, ref, update } = await import('firebase/database')
    const { db } = await import('./lib/firebase')
    const snap = await get(ref(db, `users/${user.uid}/onlineWinStreak`))
    const current = snap.val() || 0
    const newStreak = result === 'win' ? current + 1 : 0
    await update(ref(db, `users/${user.uid}`), { onlineWinStreak: newStreak })
    if (result === 'win' && newStreak > 0) {
      updateMissionProgress(user.uid, 'winStreak', newStreak, true).catch(() => {})
    }
  } catch (e) {
    console.error('Failed to update win streak:', e)
  }
}}
          user={user}
          pendingInvite={incomingInviteForAccept}
          onInviteHandled={() => {
            setPendingOnlineInvite(null)
            setIncomingInviteForAccept(null)
          }}
          tournamentMatchMeta={null}
          onTournamentMatchComplete={null}
          coinBalance={coinBalance}
        />
      )}

      {screen === 'teamOnline' && (
        <TeamMulti
          key={user?.uid || 'guest'}
          sport={teamConfig?.sport || selectedSport}
          rounds={teamConfig?.rounds || TEAM_ROUNDS}
          initialJoinCode={teamConfig?.joinCode || null}
          initialJoinTeamId={teamConfig?.joinTeamId || null}
          initialInvitePlayerId={teamConfig?.prefillInvitePlayerId || ''}
         onBack={() => {
          if (user?.uid) {
            updateMissionProgress(user.uid, 'team').catch(() => {})
          }
          returnToMainTab()
        }}
          user={user}
          coinBalance={coinBalance}
        />
      )}

      {screen === 'dailyLeaderboard' && (
        <DailyLeaderboard
          sport={selectedSport}
          highlightPlayerId={profile?.id}
          onBack={() => returnToMainTab()}
        />
      )}

      {screen === 'lightningModes' && (
        <LightningModes
          sport={selectedSport}
          onBack={() => returnToMainTab()}
          onStartSolo={handleStartLightningSolo}
          onStartH2H={handleStartLightningH2H}
          onViewLeaderboard={handleViewLightningLeaderboard}
        />
      )}

      {screen === 'tournament' && (
        <ErrorBoundary>
          <Tournament
            user={user}
            sport={selectedSport}
            onSportChange={setSelectedSport}
            onBack={() => {
              setActiveTournamentCode(null)
              returnToMainTab()
            }}
            onPlayMatch={handleTournamentMatch}
            initialCode={activeTournamentCode}
          />
        </ErrorBoundary>
      )}

      {screen === 'tournamentMatch' && tournamentMatchMeta && (
        <OnlineMulti
          key={tournamentMatchMeta.roomCode}
          sport={gameConfig?.sport || 'football'}
          rounds={gameConfig?.rounds || 10}
          user={user}
          pendingInvite={null}
          onInviteHandled={() => {}}
          tournamentMatchMeta={tournamentMatchMeta}
          onBack={() => {
            setTournamentMatchMeta(null)
            setScreen('tournament')
          }}
          onTournamentMatchComplete={() => {
            setTournamentMatchMeta(null)
            setScreen('tournament')
          }}
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

      {screen === 'lightningSolo' && lightningSoloQuestions.length > 0 && (
        <LightningRound
          questions={lightningSoloQuestions}
          sport={lightningSoloConfig?.sport || selectedSport}
          onFinish={handleFinishLightningSolo}
        />
      )}

      {screen === 'lightningH2H' && (
        <LightningH2H
          questionsHost={lightningH2HQuestionsHost}
          questionsGuest={lightningH2HQuestionsGuest}
          roomCode={lightningH2HRoomCode}
          role={lightningH2HRole}
          sport={lightningH2HConfig?.sport || selectedSport}
          userId={user?.uid}
          onFinish={handleFinishLightningH2H}
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
          coinReward={coinReward}
          coinBalance={coinBalance}
        />
      )}

      {screen === 'lightningSoloResults' && (
        <LightningResults
          scores={lightningSoloScores}
          history={lightningSoloHistory}
          config={{ ...lightningSoloConfig, totalQuestions: lightningSoloMeta?.totalQuestions || lightningSoloQuestions.length, totalTimeMs: lightningSoloMeta?.totalTimeMs }}
          onHome={() => setScreen('home')}
          onPlayAgain={handlePlayLightningSoloAgain}
          onViewLeaderboard={() => handleViewLightningLeaderboard(lightningSoloConfig?.sport)}
          coinReward={coinReward}
          coinBalance={coinBalance}
        />
      )}

      {screen === 'lightningH2HResults' && (
        <LightningResults
          scores={lightningH2HFinalScores}
          history={lightningH2HHistory}
          config={{ ...lightningH2HConfig, totalQuestions: lightningH2HMeta?.totalQuestions || 50, totalTimeMs: lightningH2HMeta?.totalTimeMs }}
          onHome={() => setScreen('home')}
          onPlayAgain={handlePlayLightningH2HAgain}
          onViewLeaderboard={() => handleViewLightningLeaderboard(lightningH2HConfig?.sport)}
          opponentName={lightningH2HOpponentName}
          isWin={lightningH2HMeta?.isWin}
          isDraw={lightningH2HMeta?.isDraw}
          coinReward={coinReward}
          coinBalance={coinBalance}
        />
      )}

      {screen === 'seasonalQuiz' && seasonalQuestions.length > 0 && (
        <SeasonalQuiz
          questions={seasonalQuestions}
          event={eventData}
          onFinish={handleFinishSeasonalQuiz}
        />
      )}

      {screen === 'seasonalResults' && (
        <SeasonalResults
          scores={seasonalScores}
          history={seasonalHistory}
          eventId={eventData?.eventId}
          eventName={eventData?.eventName}
          profile={profile}
          onHome={() => setScreen('home')}
          onPlayAgain={handlePlaySeasonalAgain}
          user={user}
          coinReward={coinReward}
          coinBalance={coinBalance}
        />
      )}
      {screen === 'commonLink' && (
  <CommonLink
    user={user}
    profile={profileState || profile}
    sport={selectedSport}
    onSportChange={setSelectedSport}
    coinReward={coinReward}
    coinBalance={coinBalance}
    onExit={() => returnToMainTab()}
    onGameFinish={async ({ score, totalQuestions, sport }) => {
  if (user?.uid) {
    recordGameplayActivity({
      userId: user.uid,
      dateKey: getDateKey(),
      source: 'commonLink',
    }).catch((error) => console.error('Failed to record gameplay activity:', error))
  }
  const rewardAmount = calculateQuizCoinReward({
    mode: 'commonLink',
    score,
    totalQuestions,
  })
  const reward = await awardUserCoins({
    amount: rewardAmount,
    reason: 'commonlink_reward',
    sourceId: `commonlink:${sport}:${score}:${Date.now()}:${user?.uid}`,
    metadata: { sport, score, totalQuestions },
    label: 'Common Link coins earned',
    detail: `${score}/${totalQuestions} correct`,
  })
  setCoinReward(reward)
}}
  />
)}
{screen === 'bestOfThree' && (
  <BestOfThreeMulti
    key={user?.uid || 'guest'}
    sport={gameConfig?.sport || selectedSport}
    rounds={gameConfig?.rounds || 5}
    user={user}
    coinBalance={coinBalance}
    pendingInvite={incomingInviteForAccept}
    onInviteHandled={() => {
      setPendingOnlineInvite(null)
      setIncomingInviteForAccept(null)
    }}
    onBack={() => returnToMainTab()}
  />
)}

{screen === 'weeklyMissions' && (
  <WeeklyMissions
    user={user}
    coinBalance={coinBalance}
    onBack={() => returnToMainTab()}
    onCoinsUpdated={() => {}}
  />
)}
      {screen === 'lightningLeaderboard' && (
        <LightningLeaderboard
          sport={selectedSport}
          onBack={() => setScreen('home')}
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

      {showAuthCallback && (
        <AuthCallback
          user={user}
          onSuccess={handleAuthCallbackSuccess}
          onPlaySolo={handlePlaySoloFromAuthCallback}
        />
      )}

      {showInvites && (
        <InviteScreen
          invites={pendingInvites}
          user={user}
          onAccepted={handleInviteAccepted}
          onClose={() => setShowInvites(false)}
        />
      )}

      <InstallPrompt
        enabled={installPromptEligible && screen === 'home' && Boolean(user) && !showAuth && !showVerify && !showAuthCallback}
      />
    </div>
  )
}

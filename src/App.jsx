import { useMemo, useState } from 'react'
import Landing from './components/Landing'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Results from './components/Results'
import Loading from './components/Loading'
import OnlineMulti from './components/OnlineMulti'
import DailyLeaderboard from './components/DailyLeaderboard'
import { generateQuestions } from './lib/question'
import {
  getDailyChallengeInfo,
  hasPlayedDailyChallenge,
  markDailyChallengePlayed,
  saveDailyLeaderboardEntry,
} from './lib/dailyChallenge'
import { loadProfile, saveProfile } from './lib/profile'
import { track } from '@vercel/analytics'

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
    setSelectedSport(sport)
    setGameConfig({ sport, rounds })
    setScreen('online')
  }

  function handleStartDaily({ sport }) {
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
      players: [profile?.displayName || 'Guest'],
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
      markDailyChallengePlayed({
        dateKey: gameConfig.challengeKey,
        sport: gameConfig.sport,
      })
    }

    setFinalScores(scores)
    setReviewData(history)
    setResultMeta({ totalTimeMs })
    setScreen('results')
  }

  function handlePlayAgain() {
    if (gameConfig?.mode === 'daily') {
      handleStartDaily({ sport: gameConfig.sport })
      return
    }
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

      setGameConfig((current) => ({
        ...current,
        players: [nextProfile.displayName],
      }))
      setSaveState({ status: 'saved', rank: saved.rank })
      track('daily_score_saved', {
        sport: gameConfig.sport,
        score: finalScores[0],
        rank: saved.rank,
      })
    } catch (e) {
      setSaveState({ status: 'error', rank: null })
      setError('Could not save your daily score. Please try again.')
    }
  }

  function handleViewDailyLeaderboard(nextSport = selectedSport) {
    setSelectedSport(nextSport)
    setScreen('dailyLeaderboard')
  }

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
      {error && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#FF5C5C', color: '#fff', padding: '10px 20px',
          borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999
        }}>
          {error}
        </div>
      )}

      {screen === 'landing' && (
        <Landing onPlay={() => setScreen('home')} />
      )}

      {screen === 'home' && (
        <Home
          sport={selectedSport}
          onSportChange={setSelectedSport}
          onStartSolo={handleStartSolo}
          onStartOnline={handleStartOnline}
          onStartDaily={handleStartDaily}
          onViewDailyLeaderboard={handleViewDailyLeaderboard}
          profile={profile}
        />
      )}

      {screen === 'online' && (
        <OnlineMulti
          sport={gameConfig?.sport || 'football'}
          rounds={gameConfig?.rounds || 5}
          onBack={() => setScreen('home')}
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
        />
      )}
    </div>
  )
}

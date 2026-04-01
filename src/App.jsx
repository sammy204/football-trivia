import { useState } from 'react'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Results from './components/Results'
import Loading from './components/Loading'
import OnlineMulti from './components/OnlineMulti'
import { generateQuestions } from './lib/question'
import { track } from '@vercel/analytics'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [questions, setQuestions] = useState([])
  const [gameConfig, setGameConfig] = useState(null)
  const [finalScores, setFinalScores] = useState([])
  const [reviewData, setReviewData] = useState([])
  const [error, setError] = useState(null)

  const sport = gameConfig?.sport || 'football'
  const accentColor = sport === 'basketball' ? '#FF6B35' : '#00FF87'

  async function launchGame(config) {
    setGameConfig(config)
    setReviewData([])
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

  function handleStartMulti({ players, rounds, sport }) {
    launchGame({ mode: 'multi', players, rounds, sport })
  }

  function handleStartOnline(sport) {
    setGameConfig({ sport })
    setScreen('online')
  }

  function handleFinish({ scores, history }) {
    setFinalScores(scores)
    setReviewData(history)
    setScreen('results')
  }

  function handlePlayAgain() {
    launchGame(gameConfig)
  }

  return (
    <div style={{ minHeight: '100vh', '--accent': accentColor }}>
      {error && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#FF5C5C', color: '#fff', padding: '10px 20px',
          borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999
        }}>
          {error}
        </div>
      )}

      {screen === 'home' && (
        <Home
          onStartSolo={handleStartSolo}
          onStartMulti={handleStartMulti}
          onStartOnline={handleStartOnline}
        />
      )}

      {screen === 'online' && (
        <OnlineMulti
          sport={gameConfig?.sport || 'football'}
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
          onHome={() => setScreen('home')}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}
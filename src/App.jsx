import { useState } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Results from './components/Results'
import Loading from './components/Loading'
import { generateQuestions } from './lib/question'
 
export default function App() {
  const [screen, setScreen] = useState('home')
  const [questions, setQuestions] = useState([])
  const [gameConfig, setGameConfig] = useState(null)
  const [finalScores, setFinalScores] = useState([])
  const [reviewData, setReviewData] = useState([])
  const [error, setError] = useState(null)

  async function launchGame(config) {
    setGameConfig(config)
    setReviewData([])
    setScreen('loading')
    setError(null)
    try {
      const qs = await generateQuestions({
        rounds: config.rounds,
      })
      setQuestions(qs)
      setScreen('quiz')
    } catch (e) {
      setError('Failed to load questions. Please try again.')
      setScreen('home')
    }
  }

  function handleStartSolo({ name, rounds }) {
    launchGame({ mode: 'solo', players: [name], rounds })
  }

  function handleStartMulti({ players, rounds }) {
    launchGame({ mode: 'multi', players, rounds })
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
    <div style={{ minHeight: '100vh' }}>
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
      <SpeedInsights />
    </div>
  )
}

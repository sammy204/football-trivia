import { useState, useEffect, useRef } from 'react'
import { saveClubScore, getWeekKey } from '../lib/clubs'

const QUESTION_TIME = 20

export default function ClubQuiz({ quiz, user, profile, onFinish, onExit }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [flash, setFlash] = useState(null)
  const timerRef = useRef(null)
  const advanceRef = useRef(null)

  const question = quiz.questions?.[index]
  const total = quiz.questions?.length || 0
  const timerPct = (timeLeft / QUESTION_TIME) * 100
  const timerColor = timeLeft <= 5 ? '#ff5c5c' : timeLeft <= 10 ? '#FFD700' : '#00ff87'

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(advanceRef.current)
    }
  }, [])

  useEffect(() => {
    setTimeLeft(QUESTION_TIME)
    setSelected(null)
    setFlash(null)
    clearInterval(timerRef.current)
    clearTimeout(advanceRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleAutoAdvance(null)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      clearInterval(timerRef.current)
      clearTimeout(advanceRef.current)
    }
  }, [index])

  function handleAutoAdvance(chosenOpt) {
    clearInterval(timerRef.current)
    setFlash(true)

    advanceRef.current = setTimeout(() => {
      const correct = chosenOpt !== null && chosenOpt === question.answer
      const newAnswers = [...answers, { question, selected: chosenOpt, correct }]
      if (index + 1 >= total) {
        onFinish?.(newAnswers)
      } else {
        setAnswers(newAnswers)
        setIndex(i => i + 1)
      }
    }, 250)
  }

  function handleSelect(opt) {
    if (selected !== null || flash !== null) return
    setSelected(opt)
    handleAutoAdvance(opt)
  }

  if (!question) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onExit}
          className="text-slate-400 hover:text-white transition text-sm font-semibold"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-sm">🔥 {quiz.club}</span>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs">Q{index + 1} of {total}</p>
          <p style={{ color: timerColor }} className="font-black text-lg">
            {timeLeft}s
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-6">
        <div
          style={{
            width: `${timerPct}%`,
            backgroundColor: timerColor,
            transition: 'width 1s linear, background-color 0.3s ease'
          }}
          className="h-full rounded-full"
        />
      </div>

      {/* Question Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="bg-linear-to-r from-amber-600/20 to-orange-600/20 text-amber-400 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-4">
          Club Challenge
        </div>
        <h2 className="text-white text-lg font-bold mb-4 leading-relaxed">
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {['a', 'b', 'c', 'd'].map((opt) => {
          let bgClass = 'bg-slate-700/50 border-slate-600'
          let textClass = 'text-white'
          let opacity = 'opacity-100'

          if (flash) {
            if (opt === selected) {
              bgClass = 'bg-slate-600/80 border-slate-500'
            } else {
              opacity = 'opacity-40'
            }
          }

          const isCorrect = opt === question.answer && flash
          const isWrong = opt === selected && flash && opt !== question.answer

          if (isCorrect) {
            bgClass = 'bg-green-500/20 border-green-500'
            textClass = 'text-green-400'
          }
          if (isWrong) {
            bgClass = 'bg-red-500/20 border-red-500'
            textClass = 'text-red-400'
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!flash}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition ${bgClass} ${textClass} ${opacity} ${!flash ? 'hover:border-slate-500' : ''} ${flash ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border-2 shrink-0 ${
                  bgClass.includes('green')
                    ? 'bg-green-500/30 border-green-500'
                    : bgClass.includes('red')
                    ? 'bg-red-500/30 border-red-500'
                    : 'bg-slate-600/50 border-slate-500'
                }`}
              >
                {opt.toUpperCase()}
              </div>
              <span className="font-semibold text-left">
                {question.options?.[opt] || `Option ${opt.toUpperCase()}`}
              </span>
            </button>
          )
        })}
      </div>

      {/* Progress Indicator */}
      <div className="text-center text-slate-400 text-xs">
        <p>
          {index + 1}/{total} questions answered
        </p>
      </div>
    </div>
  )
}

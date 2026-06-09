import { useEffect, useState } from 'react'
import { getClubQuestions, getWeekKey } from '../lib/clubs'

export default function ClubChallenge({ profile, onPlay }) {
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadQuiz() {
      if (!profile?.favoriteFootballClub) {
        setLoading(false)
        return
      }
      try {
        const questions = await getClubQuestions('football', profile.favoriteFootballClub)
        setQuiz({
          club: profile.favoriteFootballClub,
          totalQuestions: questions.length,
          questions
        })
      } catch (err) {
        console.error('Error loading quiz:', err)
      }
      setLoading(false)
    }
    loadQuiz()
  }, [profile?.favoriteFootballClub])

  if (loading || !quiz) return null

  return (
    <div
      onClick={() => onPlay?.(quiz)}
      className="bg-linear-to-br from-amber-600 via-amber-700 to-orange-700 rounded-xl p-6 mb-6 cursor-pointer hover:shadow-xl hover:shadow-amber-600/30 transition-all duration-300 transform hover:scale-102 border border-amber-500/30"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔥</span>
            <p className="text-amber-100 text-xs font-bold uppercase tracking-widest">Weekly Challenge</p>
          </div>
          <h3 className="text-white text-2xl font-black mb-2">{quiz.club}</h3>
          <p className="text-amber-50 text-sm font-semibold flex items-center gap-1">
            <span>📋</span>
            <span>{quiz.totalQuestions} Questions</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-amber-100 text-xs font-semibold mb-1">Reward</p>
          <div className="flex items-center justify-end gap-1">
            <p className="text-white text-3xl font-black">50</p>
            <p className="text-amber-100 text-xs font-semibold">Coins</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-amber-500/20 flex items-center justify-between">
        <p className="text-amber-50 text-xs font-semibold">Play now and climb the rankings</p>
        <span className="text-xl">→</span>
      </div>
    </div>
  )
}

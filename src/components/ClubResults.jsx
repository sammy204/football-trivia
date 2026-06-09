import { useEffect, useState } from 'react'
import { saveClubScore, getWeekKey, listenToClubLeaderboard } from '../lib/clubs'
import confetti from 'canvas-confetti'

export default function ClubResults({ quiz, answers, user, profile, onPlayAgain, onHome }) {
  const [saving, setSaving] = useState(true)
  const [saved, setSaved] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const score = answers.filter(a => a.correct).length
  const total = answers.length
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const weekKey = getWeekKey()
  const clubId = quiz.club?.toLowerCase()
  const playerId = profile?.playerId || user?.uid
  const displayName = profile?.displayName || 'Player'

  // Grade logic
  const grade =
    pct === 100 ? { label: 'Perfect!', emoji: '🏆', color: 'text-yellow-400', bg: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/40' } :
    pct >= 80  ? { label: 'Excellent', emoji: '🔥', color: 'text-green-400', bg: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/40' } :
    pct >= 60  ? { label: 'Good Job', emoji: '👍', color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/40' } :
    pct >= 40  ? { label: 'Keep Going', emoji: '💪', color: 'text-orange-400', bg: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-500/40' } :
                 { label: 'Try Again', emoji: '📚', color: 'text-red-400', bg: 'from-red-500/20 to-rose-500/10', border: 'border-red-500/40' }

  // Coins earned
  const coinsEarned = pct === 100 ? 100 : pct >= 80 ? 75 : pct >= 60 ? 50 : pct >= 40 ? 25 : 10

  useEffect(() => {
    if (pct >= 80) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#f59e0b', '#10b981', '#ffffff'] })
    }
  }, [])

  // Save score once on mount
  useEffect(() => {
    async function save() {
      if (!playerId || !clubId) { setSaving(false); return }
      try {
        await saveClubScore(weekKey, clubId, playerId, displayName, score, total)
        setSaved(true)
      } catch (err) {
        console.error('Failed to save club score:', err)
      }
      setSaving(false)
    }
    save()
  }, [])

  // Listen to leaderboard once saved
  useEffect(() => {
    if (!saved || !clubId) return
    const unsub = listenToClubLeaderboard(weekKey, clubId, entries => {
      setLeaderboard(entries)
      const me = entries.find(e => e.playerId === playerId)
      if (me) setMyRank(me.rank)
    }, console.error)
    return unsub
  }, [saved])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">
          🏟️ {quiz.club} · Weekly Club Quiz
        </p>
        <h1 className="text-white text-4xl font-black mb-1">{grade.emoji} {grade.label}</h1>
        <p className="text-slate-400 text-sm">Week {weekKey}</p>
      </div>

      {/* Score Card */}
      <div className={`bg-gradient-to-br ${grade.bg} border-2 ${grade.border} rounded-2xl p-6 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <p className={`text-5xl font-black ${grade.color}`}>{score}</p>
            <p className="text-slate-400 text-xs mt-1 font-semibold">CORRECT</p>
          </div>
          <div className="text-center">
            <p className="text-5xl font-black text-slate-300">{total}</p>
            <p className="text-slate-400 text-xs mt-1 font-semibold">TOTAL</p>
          </div>
          <div className="text-center">
            <p className={`text-5xl font-black ${grade.color}`}>{pct}%</p>
            <p className="text-slate-400 text-xs mt-1 font-semibold">ACCURACY</p>
          </div>
        </div>

        {/* Accuracy bar */}
        <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              pct >= 80 ? 'bg-green-400' : pct >= 60 ? 'bg-blue-400' : pct >= 40 ? 'bg-orange-400' : 'bg-red-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Coins Earned */}
      <div className="bg-slate-800/60 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪙</span>
          <div>
            <p className="text-white font-bold">Coins Earned</p>
            <p className="text-slate-400 text-xs">
              {saving ? 'Saving...' : saved ? 'Saved to your wallet' : 'Could not save'}
            </p>
          </div>
        </div>
        <p className="text-amber-400 text-3xl font-black">+{coinsEarned}</p>
      </div>

      {/* Rank badge (once leaderboard loads) */}
      {myRank !== null && (
        <div className="bg-slate-800/60 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🏅'}
            </span>
            <div>
              <p className="text-white font-bold">Your Club Rank</p>
              <p className="text-slate-400 text-xs">{quiz.club} fans this week</p>
            </div>
          </div>
          <p className="text-green-400 text-3xl font-black">#{myRank}</p>
        </div>
      )}

      {/* Answer Review */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Answer Review</h3>
        <div className="space-y-2">
          {answers.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                a.correct
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <span className="text-lg shrink-0 mt-0.5">{a.correct ? '✅' : '❌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm font-medium leading-snug">
                  {a.question?.question}
                </p>
                {!a.correct && (
                  <p className="text-green-400 text-xs mt-1">
                    ✓ {a.question?.options?.[a.question?.answer]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Toggle */}
      {leaderboard.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowLeaderboard(v => !v)}
            className="w-full flex items-center justify-between p-4 bg-slate-800/60 border border-slate-700 rounded-xl hover:border-slate-500 transition"
          >
            <span className="text-white font-bold flex items-center gap-2">
              <span>🏆</span> Weekly Rankings · {quiz.club}
            </span>
            <span className="text-slate-400 text-sm">{showLeaderboard ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {showLeaderboard && (
            <div className="mt-2 bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
              {leaderboard.slice(0, 10).map(entry => {
                const isMe = entry.playerId === playerId
                return (
                  <div
                    key={entry.playerId}
                    className={`flex items-center justify-between px-4 py-3 border-b border-slate-700/50 last:border-0 ${
                      isMe ? 'bg-green-500/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm font-bold text-slate-400">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                      </span>
                      <p className={`font-semibold text-sm ${isMe ? 'text-green-400' : 'text-white'}`}>
                        {entry.displayName}{isMe && <span className="text-xs text-green-300 ml-1">(You)</span>}
                      </p>
                    </div>
                    <p className={`font-black ${isMe ? 'text-green-400' : 'text-slate-300'}`}>
                      {entry.score}/{entry.totalQuestions}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onHome}
          className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition"
        >
          ← Home
        </button>
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-black transition shadow-lg"
        >
          Play Again 🔄
        </button>
      </div>
    </div>
  )
}
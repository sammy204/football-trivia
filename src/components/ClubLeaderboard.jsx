import { useEffect, useState } from 'react'
import { listenToClubLeaderboard, getWeekKey } from '../lib/clubs'

export default function ClubLeaderboard({ profile, clubId, onClose }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const myPlayerId = profile?.playerId || profile?.uid

  useEffect(() => {
    if (!clubId) return
    const weekKey = getWeekKey()
    const unsub = listenToClubLeaderboard(
      weekKey,
      clubId.toLowerCase(),
      (entries) => {
        setLeaderboard(entries)
        setLoading(false)
      },
      (err) => {
        console.error('Leaderboard error:', err)
        setLoading(false)
      }
    )
    return unsub
  }, [clubId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">
          <p className="text-slate-400">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <span>Weekly Rankings</span>
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">
            ✕
          </button>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No scores yet. Be the first to play!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.playerId === myPlayerId
            return (
              <div
                key={entry.playerId}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                  isCurrentUser
                    ? 'bg-linear-to-r from-green-900/40 to-green-800/20 border-green-500 shadow-lg shadow-green-500/20'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8">
                    {entry.rank === 1 && <span className="text-2xl">🥇</span>}
                    {entry.rank === 2 && <span className="text-2xl">🥈</span>}
                    {entry.rank === 3 && <span className="text-2xl">🥉</span>}
                    {entry.rank > 3 && (
                      <span className="font-bold text-lg text-slate-400">#{entry.rank}</span>
                    )}
                  </div>
                  <div>
                    <p className={`font-bold ${isCurrentUser ? 'text-green-400' : 'text-white'}`}>
                      {entry.displayName}
                      {isCurrentUser && <span className="text-xs text-green-300 ml-2">(You)</span>}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {entry.score}/{entry.totalQuestions} correct · {entry.accuracyPct}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${isCurrentUser ? 'text-green-400' : 'text-green-500'}`}>
                    {entry.score}
                  </p>
                  <p className="text-xs text-slate-400">pts</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

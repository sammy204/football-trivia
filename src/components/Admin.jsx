import { useState, useEffect } from 'react'
import { ref, onValue, push, update, remove, set, get } from 'firebase/database'
import { db } from '../lib/firebase'
import styles from './Admin.module.css'
import Notifications from './Notifications'
import Analytics from './Analytics'

const ADMIN_UID = 'K4qCnBhAVDMTkvK70SMVfbbsw463'

const SPORTS = ['football', 'basketball']
const DIFFICULTIES = ['easy', 'medium', 'hard']

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: '⚡' },
  { id: 'questions', label: 'Questions', icon: '❓' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
]

const emptyForm = {
  question: '',
  a: '',
  b: '',
  c: '',
  d: '',
  answer: 'a',
  difficulty: 'medium',
  isDaily: false,
}

// ─── Overview ───────────────────────────────────────────────────────────────
function Overview() {
 const [migrating, setMigrating] = useState(false)
  const [migrated, setMigrated] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: null,
    gamesPlayed: null,
    dailyChallenges: null,
    bannedUsers: null,
  })
   
  async function migratePlayerIds() {
    setMigrating(true)
    try {
      const snap = await get(ref(db, 'users'))
      const users = snap.val() || {}
      for (const [uid, userData] of Object.entries(users)) {
        if (userData.playerId) {
          await set(ref(db, `playerIds/${userData.playerId}`), uid)
        }
      }
      setMigrated(true)
      console.log('Migration done')
    } catch (e) {
      console.error('Migration failed:', e)
    }
    setMigrating(false)
  }
  useEffect(() => {
    // Total users
    const usersRef = ref(db, 'users')
    const unsubUsers = onValue(usersRef, snap => {
      const data = snap.val()
      setStats(s => ({ ...s, totalUsers: data ? Object.keys(data).length : 0 }))
    })

    // Daily challenge entries (count unique dateKey/sport combos played)
    const dailyRef = ref(db, 'dailyLeaderboards')
    const unsubDaily = onValue(dailyRef, snap => {
      const data = snap.val()
      if (!data) return setStats(s => ({ ...s, dailyChallenges: 0, gamesPlayed: 0 }))

      let totalEntries = 0
      let dateCount = 0

      Object.values(data).forEach(dateNode => {
        dateCount++
        Object.values(dateNode).forEach(sportNode => {
          const entries = sportNode.entries ? Object.keys(sportNode.entries).length : 0
          totalEntries += entries
        })
      })

      setStats(s => ({ ...s, dailyChallenges: dateCount, gamesPlayed: totalEntries }))
    })

    // Banned users
    const bannedRef = ref(db, 'bannedUsers')
    const unsubBanned = onValue(bannedRef, snap => {
      const data = snap.val()
      setStats(s => ({ ...s, bannedUsers: data ? Object.keys(data).length : 0 }))
    })

    return () => {
      unsubUsers()
      unsubDaily()
      unsubBanned()
    }
  }, [])

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥' },
    { label: 'Games Played', value: stats.gamesPlayed, icon: '🎮' },
    { label: 'Daily Challenges', value: stats.dailyChallenges, icon: '📅' },
    { label: 'Banned Users', value: stats.bannedUsers, icon: '🚫' },
  ]

return (
    <div className={styles.overviewGrid}>
      {cards.map(s => (
        <div key={s.label} className={styles.statCard}>
          <span className={styles.statIcon}>{s.icon}</span>
          <div>
            <p className={styles.statValue}>{s.value ?? '—'}</p>
            <p className={styles.statLabel}>{s.label}</p>
          </div>
        </div>
      ))}
      <div className={styles.statCard}>
  <button 
    onClick={migratePlayerIds} 
    disabled={migrating || migrated}
    style={{ 
      background: '#00FF87', 
      color: '#0a1f0f', 
      border: 'none', 
      borderRadius: 8, 
      padding: '10px 16px', 
      fontWeight: 700, 
      cursor: 'pointer',
      width: '100%'
    }}
  >
    {migrated ? '✅ Migration done' : migrating ? 'Migrating...' : 'Run Player ID Migration'}
  </button>
</div>
    </div>
  )
}
// ─── Question Manager ────────────────────────────────────────────────────────
function QuestionManager() {
  const [sport, setSport] = useState('football')
  const [tab, setTab] = useState('all') // 'all' | 'daily'
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDiff, setFilterDiff] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toast, setToast] = useState(null)

  const dbPath = tab === 'daily'
    ? `adminQuestions/${sport}/daily`
    : `adminQuestions/${sport}/bank`

  useEffect(() => {
    setLoading(true)
    const r = ref(db, dbPath)
    const unsub = onValue(r, snap => {
      const data = snap.val()
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        setQuestions(list)
      } else {
        setQuestions([])
      }
      setLoading(false)
    })
    return () => unsub()
  }, [sport, tab])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openAdd = () => {
    setForm({ ...emptyForm, isDaily: tab === 'daily' })
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (q) => {
    setForm({
      question: q.question,
      a: q.options?.a ?? '',
      b: q.options?.b ?? '',
      c: q.options?.c ?? '',
      d: q.options?.d ?? '',
      answer: q.answer,
      difficulty: q.difficulty ?? 'medium',
      isDaily: tab === 'daily',
    })
    setEditId(q.id)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setForm(emptyForm)
    setEditId(null)
  }

  const handleSave = async () => {
    if (!form.question.trim() || !form.a.trim() || !form.b.trim() || !form.c.trim() || !form.d.trim()) {
      showToast('Fill in all fields.', 'error')
      return
    }
    setSaving(true)
    const payload = {
      question: form.question.trim(),
      options: { a: form.a.trim(), b: form.b.trim(), c: form.c.trim(), d: form.d.trim() },
      answer: form.answer,
      difficulty: form.difficulty,
      sport,
      updatedAt: Date.now(),
    }
    try {
      if (editId) {
        await update(ref(db, `${dbPath}/${editId}`), payload)
        showToast('Question updated!')
      } else {
        payload.createdAt = Date.now()
        await push(ref(db, dbPath), payload)
        showToast('Question added!')
      }
      closeForm()
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error')
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    try {
      await remove(ref(db, `${dbPath}/${id}`))
      showToast('Question deleted.')
      setDeleteConfirm(null)
    } catch (e) {
      showToast('Delete failed: ' + e.message, 'error')
    }
  }

  const filtered = questions.filter(q => {
    const matchSearch = q.question?.toLowerCase().includes(search.toLowerCase())
    const matchDiff = filterDiff === 'all' || q.difficulty === filterDiff
    return matchSearch && matchDiff
  })

  return (
    <div className={styles.qmWrap}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.msg}</div>
      )}

      {/* Sport tabs */}
      <div className={styles.sportTabs}>
        {SPORTS.map(s => (
          <button
            key={s}
            className={`${styles.sportTab} ${sport === s ? styles.sportTabActive : ''}`}
            onClick={() => setSport(s)}
          >
            {s === 'football' ? '⚽' : '🏀'} {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Bank / Daily tabs */}
      <div className={styles.bankTabs}>
        <button
          className={`${styles.bankTab} ${tab === 'all' ? styles.bankTabActive : ''}`}
          onClick={() => setTab('all')}
        >
          Question Bank
        </button>
        <button
          className={`${styles.bankTab} ${tab === 'daily' ? styles.bankTabActive : ''}`}
          onClick={() => setTab('daily')}
        >
          Daily Challenge
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.qmToolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search questions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.diffSelect}
          value={filterDiff}
          onChange={e => setFilterDiff(e.target.value)}
        >
          <option value="all">All Difficulties</option>
          {DIFFICULTIES.map(d => (
            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
        <button className={styles.addBtn} onClick={openAdd}>+ Add Question</button>
      </div>

      {/* Count */}
      <p className={styles.qmCount}>
        {loading ? 'Loading…' : `${filtered.length} question${filtered.length !== 1 ? 's' : ''}`}
      </p>

      {/* Question list */}
      {loading ? (
        <div className={styles.loadingRow}>Loading questions…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📭</span>
          <p>No questions yet. Add your first one!</p>
        </div>
      ) : (
        <div className={styles.questionList}>
          {filtered.map((q, i) => (
            <div key={q.id} className={styles.questionRow}>
              <div className={styles.questionMeta}>
                <span className={styles.qIndex}>#{i + 1}</span>
                <span className={`${styles.diffBadge} ${styles[q.difficulty]}`}>
                  {q.difficulty ?? 'medium'}
                </span>
              </div>
              <div className={styles.questionBody}>
                <p className={styles.questionText}>{q.question}</p>
                <div className={styles.optionsGrid}>
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <span
                      key={opt}
                      className={`${styles.optionChip} ${q.answer === opt ? styles.correctChip : ''}`}
                    >
                      <strong>{opt.toUpperCase()}.</strong> {q.options?.[opt] ?? '—'}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.questionActions}>
                <button className={styles.editBtn} onClick={() => openEdit(q)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => setDeleteConfirm(q.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={closeForm}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{editId ? 'Edit Question' : 'Add Question'}</h3>

            <label className={styles.formLabel}>Question</label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              placeholder="Enter the question…"
            />

            <div className={styles.optionsFormGrid}>
              {['a', 'b', 'c', 'd'].map(opt => (
                <div key={opt} className={styles.optionField}>
                  <label className={styles.optLabel}>{opt.toUpperCase()}</label>
                  <input
                    className={styles.formInput}
                    value={form[opt]}
                    onChange={e => setForm(f => ({ ...f, [opt]: e.target.value }))}
                    placeholder={`Option ${opt.toUpperCase()}`}
                  />
                </div>
              ))}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Correct Answer</label>
                <select
                  className={styles.formSelect}
                  value={form.answer}
                  onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                >
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Difficulty</label>
                <select
                  className={styles.formSelect}
                  value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                >
                  {DIFFICULTIES.map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeForm}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete Question?</h3>
            <p className={styles.confirmText}>This cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={() => handleDelete(deleteConfirm)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ─── User Manager ────────────────────────────────────────────────────────────
function UserManager() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const r = ref(db, 'users')
    const unsub = onValue(r, snap => {
      const data = snap.val()
      if (data) {
        const list = Object.entries(data).map(([uid, val]) => ({ uid, ...val }))
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        setUsers(list)
      } else {
        setUsers([])
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.playerId || '').toLowerCase().includes(q) ||
      (u.uid || '').toLowerCase().includes(q)
    )
  })

  function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className={styles.qmWrap}>
      <div className={styles.qmToolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search by name, player ID, or UID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <p className={styles.qmCount}>
        {loading ? 'Loading…' : `${filtered.length} user${filtered.length !== 1 ? 's' : ''}`}
      </p>

      {loading ? (
        <div className={styles.loadingRow}>Loading users…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <span>👥</span>
          <p>No users found.</p>
        </div>
      ) : (
        <div className={styles.questionList}>
          {filtered.map(u => (
            <div key={u.uid} className={styles.questionRow} style={{ cursor: 'pointer' }} onClick={() => setSelected(u)}>
              <div className={styles.questionMeta}>
                <span className={styles.statIcon}>👤</span>
              </div>
              <div className={styles.questionBody}>
                <p className={styles.questionText}>{u.displayName || 'Unnamed User'}</p>
                <div className={styles.optionsGrid}>
                  <span className={styles.optionChip}><strong>ID:</strong> {u.playerId || '—'}</span>
                  <span className={styles.optionChip}><strong>Streak:</strong> {u.dailyStreak?.current ?? 0} 🔥</span>
                  <span className={styles.optionChip}><strong>Joined:</strong> {formatDate(u.createdAt)}</span>
                  <span className={styles.optionChip}><strong>UID:</strong> {u.uid.slice(0, 10)}…</span>
                </div>
              </div>
              <div className={styles.questionActions}>
                <button className={styles.editBtn} onClick={e => { e.stopPropagation(); setSelected(u) }}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User detail modal */}
      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>👤 {selected.displayName || 'Unnamed User'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <p><strong>Player ID:</strong> {selected.playerId || '—'}</p>
              <p><strong>UID:</strong> {selected.uid}</p>
              <p><strong>Joined:</strong> {formatDate(selected.createdAt)}</p>
              <p><strong>Current Streak:</strong> {selected.dailyStreak?.current ?? 0} 🔥</p>
              <p><strong>Best Streak:</strong> {selected.dailyStreak?.best ?? 0} 🏆</p>
              <p><strong>Last Played:</strong> {selected.dailyStreak?.lastPlayedDateKey || '—'}</p>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Placeholder sections ────────────────────────────────────────────────────
function ComingSoon({ label }) {
  return (
    <div className={styles.comingSoonSection}>
      <span className={styles.comingSoonIcon}>🚧</span>
      <h3>{label}</h3>
      <p>This section is coming soon.</p>
    </div>
  )
}

// ─── Main Admin component ────────────────────────────────────────────────────
export default function Admin({ user, onBack }) {
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!user || user.uid !== ADMIN_UID) {
    return (
      <div className={styles.denied}>
        <span className={styles.deniedIcon}>🔒</span>
        <h1>Access Denied</h1>
        <p>You are not authorized to view this page.</p>
        <button className={styles.backBtn} onClick={onBack}>Back</button>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <Overview />
      case 'questions': return <QuestionManager />
      case 'users': return <UserManager />
       case 'notifications': return <Notifications />
       case 'analytics': return <Analytics />
      default: return <Overview />
    }
  }

  const active = SECTIONS.find(s => s.id === activeSection)

  return (
    <div className={styles.adminShell}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarTop}>
          <img className={styles.logo} src="/logo-mark.svg" alt="Trivela" />
          {sidebarOpen && <span className={styles.sidebarTitle}>Admin</span>}
        </div>
        <nav className={styles.sidebarNav}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`${styles.navItem} ${activeSection === s.id ? styles.navItemActive : ''}`}
              onClick={() => setActiveSection(s.id)}
              title={s.label}
            >
              <span className={styles.navIcon}>{s.icon}</span>
              {sidebarOpen && <span className={styles.navLabel}>{s.label}</span>}
            </button>
          ))}
        </nav>
        <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(o => !o)}>
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      {/* Main content */}
      <main className={styles.mainContent}>
        <header className={styles.mainHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.sectionTitle}>{active?.icon} {active?.label}</h2>
          </div>
          <button onClick={onBack} className={styles.backBtn}>Back</button>
        </header>
        <div className={styles.sectionBody}>
          {renderSection()}
        </div>
      </main>
    </div>
  )
}
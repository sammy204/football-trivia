import { useState, useEffect } from 'react'
import {
  listenToAllSeasonalEvents,
  createSeasonalEvent,
  setSeasonalEventActive,
  deleteSeasonalEvent,
} from '../lib/seasonalEvents'
import styles from './Admin.module.css'

const EMPTY_FORM = {
  name: '',
  sport: 'football',
  type: 'countdown',
  startDate: '',
  endDate: '',
  coinMultiplier: '2',
  entryFee: '0',
  dailyQuestions: '10',
  notifCopy: '',
  description: '',
}

const sportIcon = { football: '⚽', basketball: '🏀' }
const typeLabel = { countdown: 'Countdown', opener: 'Season Opener', history: 'History Drop' }

function deriveStatus(event) {
  const today = new Date().toISOString().slice(0, 10)
  if (!event.active) return 'ended'
  if (event.startDate && event.startDate > today) return 'scheduled'
  if (event.endDate && event.endDate < today) return 'ended'
  return 'active'
}

const statusColors = {
  active:    { bg: '#0d2b1a', color: '#39e87c', border: '#1a4d2e' },
  scheduled: { bg: '#2b2200', color: '#f5a623', border: '#4d3800' },
  ended:     { bg: '#1a1a1a', color: '#666',    border: '#2a2a2a' },
}

export default function SeasonalEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterStatus, setFilterStatus] = useState('all')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    const unsubscribe = listenToAllSeasonalEvents(
      (liveEvents) => {
        setEvents(liveEvents)
        setLoading(false)
      },
      (err) => {
        console.error('Seasonal events listener error:', err)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const eventsWithStatus = events.map(e => ({ ...e, status: deriveStatus(e) }))
  const filtered = filterStatus === 'all'
    ? eventsWithStatus
    : eventsWithStatus.filter(e => e.status === filterStatus)

  const activeCount    = eventsWithStatus.filter(e => e.status === 'active').length
  const scheduledCount = eventsWithStatus.filter(e => e.status === 'scheduled').length

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createSeasonalEvent({
        name:             form.name,
        sport:            form.sport,
        type:             form.type,
        startDate:        form.startDate,
        endDate:          form.endDate,
        description:      form.description,
        coinMultiplier:   parseFloat(form.coinMultiplier),
        entryFee:         parseInt(form.entryFee),
        dailyQuestions:   parseInt(form.dailyQuestions),
        notificationText: form.notifCopy,
      })
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setView('list')
        setForm(EMPTY_FORM)
      }, 1200)
    } catch (err) {
      setError('Failed to create event. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleEndEvent(id) {
    try {
      await setSeasonalEventActive(id, false)
      setView('list')
      setSelectedEvent(null)
    } catch (err) {
      setError('Failed to end event.')
    }
  }

  async function handleReactivate(id) {
    try {
      await setSeasonalEventActive(id, true)
    } catch (err) {
      setError('Failed to reactivate event.')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this event permanently?')) return
    try {
      await deleteSeasonalEvent(id)
      setView('list')
      setSelectedEvent(null)
    } catch (err) {
      setError('Failed to delete event.')
    }
  }

  return (
    <div className={styles.qmWrap}>
      {error && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      {view === 'list' && (
        <>
          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Active Events',   value: loading ? '—' : activeCount,               icon: '🟢' },
              { label: 'Scheduled',       value: loading ? '—' : scheduledCount,             icon: '🕐' },
              { label: 'Total Events',    value: loading ? '—' : events.length,              icon: '📅' },
            ].map(s => (
              <div key={s.label} className={styles.statCard}>
                <span className={styles.statIcon}>{s.icon}</span>
                <div>
                  <p className={styles.statValue}>{s.value}</p>
                  <p className={styles.statLabel}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter + table */}
          <div className={styles.tableWrap}>
            <div className={styles.tableHeader}>
              <span>All events</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['all', 'active', 'scheduled', 'ended'].map(f => (
                  <button
                    key={f}
                    className={`${styles.filterBtn} ${filterStatus === f ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilterStatus(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className={styles.loadingRow}>Loading events…</div>
            )}

            {!loading && filtered.length === 0 && (
              <div className={styles.emptyState}>
                <span>📭</span>
                <p>{filterStatus === 'all' ? 'No events yet. Create your first one.' : `No ${filterStatus} events.`}</p>
              </div>
            )}

            {!loading && filtered.map((ev, i) => {
              const sc = statusColors[ev.status]
              return (
                <div
                  key={ev.id}
                  className={styles.questionRow}
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setSelectedEvent(ev); setView('detail') }}
                >
                  <div className={styles.questionMeta}>
                    <span className={styles.statIcon}>{sportIcon[ev.sport] || '🏆'}</span>
                  </div>
                  <div className={styles.questionBody}>
                    <p className={styles.questionText}>{ev.name}</p>
                    <div className={styles.optionsGrid}>
                      <span className={styles.optionChip}><strong>Type:</strong> {typeLabel[ev.type] || ev.type}</span>
                      <span className={styles.optionChip}><strong>Dates:</strong> {ev.startDate} → {ev.endDate}</span>
                      <span className={styles.optionChip}><strong>Multiplier:</strong> {ev.coinMultiplier}x</span>
                    </div>
                  </div>
                  <div className={styles.questionActions}>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <button className={styles.addBtn} onClick={() => setView('create')} style={{ marginTop: '16px' }}>
            + Create Event
          </button>
        </>
      )}

      {view === 'create' && (
        <div className={styles.formWrap}>
          <h3 className={styles.formTitle}>Create Seasonal Event</h3>
          <form onSubmit={handleCreate}>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>Event name *</label>
              <input
                className={styles.formInput}
                required
                placeholder="e.g. World Cup 2026 Quiz"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>Description *</label>
              <textarea
                className={styles.formTextarea}
                rows={2}
                placeholder="Shown on home carousel card"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sport *</label>
                <select className={styles.formSelect} value={form.sport} onChange={e => setForm(p => ({ ...p, sport: e.target.value }))}>
                  <option value="football">Football</option>
                  <option value="basketball">Basketball</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Type</label>
                <select className={styles.formSelect} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="countdown">Countdown</option>
                  <option value="opener">Season Opener</option>
                  <option value="history">History Drop</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Start date *</label>
                <input className={styles.formInput} type="date" required value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>End date *</label>
                <input className={styles.formInput} type="date" required value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Questions per play</label>
                <select className={styles.formSelect} value={form.dailyQuestions} onChange={e => setForm(p => ({ ...p, dailyQuestions: e.target.value }))}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Coin multiplier</label>
                <select className={styles.formSelect} value={form.coinMultiplier} onChange={e => setForm(p => ({ ...p, coinMultiplier: e.target.value }))}>
                  <option value="1">1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Entry fee</label>
                <input className={styles.formInput} type="number" min="0" value={form.entryFee} onChange={e => setForm(p => ({ ...p, entryFee: e.target.value }))} />
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>Notification text</label>
              <textarea
                className={styles.formTextarea}
                rows={2}
                placeholder="Use {n} for day number"
                value={form.notifCopy}
                onChange={e => setForm(p => ({ ...p, notifCopy: e.target.value }))}
              />
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => { setView('list'); setForm(EMPTY_FORM); setError('') }}>
                Cancel
              </button>
              <button type="submit" className={styles.saveBtn} disabled={saving || saved}>
                {saving ? 'Saving…' : saved ? '✓ Published' : 'Publish Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'detail' && selectedEvent && (() => {
        const ev = selectedEvent
        const sc = statusColors[ev.status]
        return (
          <div className={styles.detailWrap}>
            <div className={styles.detailHeader}>
              <div>
                <h3 className={styles.detailTitle}>{sportIcon[ev.sport]} {ev.name}</h3>
                <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                  {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                </span>
              </div>
            </div>

            <div className={styles.detailBody}>
              {[
                ['Type',               typeLabel[ev.type] || ev.type],
                ['Sport',              sportIcon[ev.sport] || ev.sport],
                ['Start date',         ev.startDate || '—'],
                ['End date',           ev.endDate || '—'],
                ['Questions per play', ev.dailyQuestions || 10],
                ['Coin multiplier',    `${ev.coinMultiplier}x`],
                ['Entry fee',          ev.entryFee === 0 ? 'Free' : `${ev.entryFee} coins`],
                ['Description',        ev.description || '—'],
                ['Created',            ev.createdAt ? new Date(ev.createdAt).toLocaleDateString() : '—'],
              ].map(([k, v]) => (
                <div key={k} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{k}</span>
                  <span className={styles.detailValue}>{v}</span>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              {ev.status === 'active' && (
                <button className={styles.deleteBtn} onClick={() => handleEndEvent(ev.id)}>
                  End Event Early
                </button>
              )}
              {ev.status === 'ended' && (
                <button className={styles.editBtn} onClick={() => handleReactivate(ev.id)}>
                  Reactivate
                </button>
              )}
              <button className={styles.deleteBtn} onClick={() => handleDelete(ev.id)}>
                Delete Permanently
              </button>
              <button className={styles.cancelBtn} onClick={() => { setView('list'); setSelectedEvent(null) }}>
                Back
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

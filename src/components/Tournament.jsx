import { useState, useEffect, useCallback, useRef } from "react";
import TournamentBracket from "./TournamentBracket";
import {
  createTournament,
  joinTournament,
  startTournament,
  subscribeTournament,
  getPublicTournaments,
  findPlayerMatch,
  recordMatchWinner,
  setMatchActive,
} from "../lib/tournament";
import styles from './LightningModes.module.css';
import { recordGameplayActivity } from '../lib/streaks'

const MIN_START_PLAYERS = 2

const TOURNAMENT_FORMATS = {
  standard: {
    key: 'standard',
    label: 'Standard Bracket',
    eyebrow: 'Classic Tournament',
    title: 'Bracket battle',
    sub: 'Create, join, or browse a single-elimination tournament.',
    icon: '🏆',
    accent: 'var(--green)',
  },
  commonLink: {
    key: 'commonLink',
    label: 'Common Link Cup',
    eyebrow: 'Puzzle Tournament',
    title: 'Find the link',
    sub: 'Turn Common Link into a competitive cup format.',
    icon: '🔗',
    accent: 'var(--green)',
  },
  lightning: {
    key: 'lightning',
    label: 'Lightning Cup',
    eyebrow: 'Speed Tournament',
    title: 'Fast and fierce',
    sub: 'Build a rapid-fire bracket around lightning matches.',
    icon: '⚡',
    accent: 'var(--green)',
  },
}

export default function Tournament({ user, sport: sportProp = "football", onSportChange, onBack, onPlayMatch, initialCode }) {
  const [step, setStep] = useState(initialCode ? "live" : "sportSelect");
  const [view, setView] = useState(initialCode ? "bracket" : "hub");
  const [tournament, setTournament] = useState(null);
  const [tournamentCode, setTournamentCode] = useState(initialCode || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [publicList, setPublicList] = useState([]);
  const unsubRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    sport: sportProp,
    format: "standard",
    visibility: "private",
    maxPlayers: 8,
    startDate: "",
    startTime: "",
  });

  const [joinCode, setJoinCode] = useState("");

  const activeFormat = TOURNAMENT_FORMATS[form.format] || TOURNAMENT_FORMATS.standard
  const sportLabel = form.sport === 'football' ? 'Football' : 'Basketball'

  const heroMeta = (() => {
    if (step === 'sportSelect') {
      return {
        eyebrow: 'Tournament Hub',
        title: 'Pick a sport',
        sub: 'Choose the theme before selecting your tournament style.',
      }
    }

    if (step === 'formatSelect') {
      return {
        eyebrow: 'Tournament Type',
        title: `${sportLabel} tournaments`,
        sub: 'Choose the kind of competition you want to run.',
      }
    }

    if (view === 'create') {
      return {
        eyebrow: activeFormat.eyebrow,
        title: `Create ${activeFormat.label}`,
        sub: activeFormat.sub,
      }
    }

    if (view === 'join') {
      return {
        eyebrow: activeFormat.eyebrow,
        title: `Join ${activeFormat.label}`,
        sub: 'Use the 6-character code your host shared.',
      }
    }

    if (view === 'browse') {
      return {
        eyebrow: activeFormat.eyebrow,
        title: `${activeFormat.label} browser`,
        sub: 'Browse live public tournaments that are still waiting for players.',
      }
    }

    if (view === 'lobby' && tournament) {
      return {
        eyebrow: 'Lobby',
        title: tournament.name || 'Tournament lobby',
        sub: 'Share the code, fill the bracket, then start the matchups.',
      }
    }

    if (view === 'bracket' && tournament) {
      return {
        eyebrow: tournament.status === 'complete' ? 'Final Result' : 'Live Bracket',
        title: tournament.name || 'Tournament bracket',
        sub: tournament.status === 'complete'
          ? 'The champion is crowned below.'
          : 'Tap your glowing match card when it is ready.',
      }
    }

    return {
      eyebrow: activeFormat.eyebrow,
      title: activeFormat.title,
      sub: activeFormat.sub,
    }
  })()

  const subscribeTo = useCallback((code) => {
    if (unsubRef.current) unsubRef.current();
    const unsub = subscribeTournament(code, (data) => {
      if (data) {
        setTournament(data);
        if (data.sport) {
          setForm((current) => (current.sport === data.sport ? current : { ...current, sport: data.sport }));
          onSportChange?.(data.sport);
        }
        if (data.format) {
          setForm((current) => (current.format === data.format ? current : { ...current, format: data.format }));
        }
        setView((currentView) => {
          if (
            currentView !== "hub" &&
            (data.status === "active" || data.status === "complete" || data.bracket)
          ) {
            return "bracket";
          }
          if (
            code === initialCode &&
            (data.status === "active" || data.status === "complete")
          ) {
            return "bracket";
          }
          return currentView;
        });
      }
    });
    unsubRef.current = unsub;
  }, [initialCode]);

  useEffect(() => {
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  useEffect(() => {
    if (!initialCode) return;
    subscribeTo(initialCode);
  }, [initialCode, subscribeTo]);

  useEffect(() => {
    if (initialCode) return;
    setForm((current) => (current.sport === sportProp ? current : { ...current, sport: sportProp }));
  }, [initialCode, sportProp]);

  useEffect(() => {
    if (step !== 'live') return;
    if (tournament?.sport && tournament.sport !== form.sport) {
      setForm((current) => ({ ...current, sport: tournament.sport }));
      onSportChange?.(tournament.sport);
    }
  }, [step, tournament?.sport]);

  function selectSport(nextSport) {
    setForm((current) => ({ ...current, sport: nextSport }));
    onSportChange?.(nextSport);
    setStep('formatSelect');
    setView('hub');
  }

  function selectFormat(nextFormat) {
    setForm((current) => ({ ...current, format: nextFormat }));
    setStep('live');
    setView('hub');
  }

  async function handleCreate() {
    setError("");
    if (!form.name.trim()) return setError("Please enter a tournament name.");
    if (!form.startDate || !form.startTime)
      return setError("Please set a start date and time.");
    const startTime = new Date(`${form.startDate}T${form.startTime}`).getTime();
    if (isNaN(startTime) || startTime < Date.now())
      return setError("Start time must be in the future.");
    setLoading(true);
    try {
      const code = await createTournament({
        hostUid: user.uid,
        hostName: user.displayName || "Host",
        name: form.name.trim(),
        sport: form.sport,
        format: form.format,
        visibility: form.visibility,
        maxPlayers: Number(form.maxPlayers),
        startTime,
      });
      setTournamentCode(code);
      subscribeTo(code);
      setView("lobby");
    } catch (e) {
      setError("Failed to create tournament. Please try again.");
    }
    setLoading(false);
  }

  async function handleJoin(code) {
    setError("");
    const c = (code || joinCode).toUpperCase().trim();
    if (!c) return setError("Please enter a tournament code.");
    setLoading(true);
    try {
      const result = await joinTournament(c, user.uid, user.displayName || "Player");
      if (!result.success) {
        setError(result.error || "Could not join tournament.");
        setLoading(false);
        return;
      }
      setTournamentCode(c);
      subscribeTo(c);
      setView("lobby");
    } catch (e) {
      setError("Failed to join tournament.");
    }
    setLoading(false);
  }

  async function handleBrowse() {
    setLoading(true);
    try {
      const list = await getPublicTournaments();
      setPublicList(list);
      setView("browse");
    } catch (e) {
      setError("Failed to load public tournaments.");
    }
    setLoading(false);
  }

  async function handleStart() {
    setError("");
    setLoading(true);
    try {
      const result = await startTournament(tournamentCode);
      if (!result.success) setError(result.error || "Could not start tournament.");
    } catch (e) {
      setError("Failed to start tournament.");
    }
    setLoading(false);
  }

  function handleMatchClick({ roundIndex, matchIndex, match }) {
    if (!match.roomCode) return;
    setMatchActive(tournamentCode, roundIndex, matchIndex);
    onPlayMatch({
      roomCode: match.roomCode,
      tournamentCode,
      roundIndex,
      matchIndex,
      sport: tournament.sport,
    });
  }

  function handleBack() {
    if (step === 'sportSelect') {
      onBack();
      return;
    }

    if (step === 'formatSelect') {
      setStep('sportSelect');
      return;
    }

    if (view === "hub") {
      setStep('formatSelect');
    } else {
      setView("hub");
      setError("");
    }
  }

  return (
    <div className={styles.wrap}>

      {/* Back button — hidden on hub (HubView renders its own) */}
      <div style={s.topBar}>
        <button className={styles.backBtn} onClick={handleBack}>Back</button>
      </div>

      {/* Error banner */}
      {error && <p className={styles.error}>⚠ {error}</p>}

      <div style={s.heroCard}>
        <p className={styles.kicker} style={{ marginBottom: 8 }}>{heroMeta.eyebrow}</p>
        <h1 className={styles.title} style={{ marginBottom: 10, fontSize: 'clamp(30px, 7vw, 52px)' }}>
          {heroMeta.title}
        </h1>
        <p className={styles.sub} style={{ marginBottom: 12 }}>{heroMeta.sub}</p>
      </div>

      {step === "sportSelect" && (
        <SportSelectView
          sport={form.sport}
          onSelect={selectSport}
          loading={loading}
        />
      )}

      {step === "formatSelect" && (
        <FormatSelectView
          sport={form.sport}
          format={form.format}
          onSelect={selectFormat}
          onBack={handleBack}
        />
      )}

      {step !== "sportSelect" && step !== "formatSelect" && view === "hub" && (
        <HubView
          onCreate={() => { setError(""); setView("create"); }}
          onJoin={() => { setError(""); setView("join"); }}
          onBrowse={handleBrowse}
          loading={loading}
          sport={form.sport}
          format={form.format}
        />
      )}

      {view === "create" && (
        <CreateView form={form} setForm={setForm} onSubmit={handleCreate} loading={loading} />
      )}

      {view === "join" && (
        <JoinView joinCode={joinCode} setJoinCode={setJoinCode} onJoin={() => handleJoin()} loading={loading} />
      )}

      {view === "browse" && (
        <BrowseView list={publicList} onJoin={(code) => handleJoin(code)} loading={loading} />
      )}

      {view === "lobby" && tournament && (
        <LobbyView
          tournament={tournament}
          tournamentCode={tournamentCode}
          currentUid={user.uid}
          onStart={handleStart}
          loading={loading}
        />
      )}

      {view === "bracket" && tournament && (
        <BracketView
          tournament={tournament}
          tournamentCode={tournamentCode}
          currentUid={user.uid}
          onMatchClick={handleMatchClick}
        />
      )}
    </div>
  );
}

// ─── Hub ─────────────────────────────────────────────────────────────────────

function HubView({ onCreate, onJoin, onBrowse, loading, sport, format }) {
  return (
    <>
      <div style={s.modeBanner}>
        <span style={s.modeBannerIcon}>{TOURNAMENT_FORMATS[format]?.icon || '🏆'}</span>
        <div style={s.modeBannerText}>
          <p style={s.modeBannerEyebrow}>{TOURNAMENT_FORMATS[format]?.label || 'Tournament'}</p>
          <p style={s.modeBannerCopy}>{sport === 'basketball' ? 'Basketball' : 'Football'} theme active</p>
        </div>
      </div>

      <div style={s.hubGrid}>
        <button style={s.hubCard} onClick={onCreate} disabled={loading}>
          <span style={s.hubIcon}>🏆</span>
          <span style={s.hubCardTitle}>Create</span>
          <span style={s.hubCardCopy}>Host your own tournament and invite players.</span>
        </button>

        <button style={s.hubCard} onClick={onJoin} disabled={loading}>
          <span style={s.hubIcon}>🔑</span>
          <span style={s.hubCardTitle}>Join</span>
          <span style={s.hubCardCopy}>Enter a 6-character code to join a tournament.</span>
        </button>

        <button style={s.hubCard} onClick={onBrowse} disabled={loading}>
          <span style={s.hubIcon}>🌍</span>
          <span style={s.hubCardTitle}>Browse</span>
          <span style={s.hubCardCopy}>Find and join public tournaments.</span>
        </button>
      </div>
    </>
  );
}

function SportSelectView({ sport, onSelect, loading }) {
  return (
    <div style={s.selectionStack}>
      <div style={s.selectionGrid}>
        {[
          { key: 'football', icon: '⚽', title: 'Football', copy: 'Football tournaments and cups.' },
          { key: 'basketball', icon: '🏀', title: 'Basketball', copy: 'Basketball tournaments and cups.' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={loading}
            onClick={() => onSelect(item.key)}
            style={{ ...s.selectionCard, ...(sport === item.key ? s.selectionCardActive : {}) }}
          >
            <span style={s.selectionIcon}>{item.icon}</span>
            <span style={s.selectionTitle}>{item.title}</span>
            <span style={s.selectionCopy}>{item.copy}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FormatSelectView({ sport, format, onSelect }) {
  return (
    <div style={s.selectionStack}>
      <div style={s.selectionGrid}>
        {Object.values(TOURNAMENT_FORMATS).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            style={{ ...s.selectionCard, ...(format === item.key ? s.selectionCardActive : {}) }}
          >
            <span style={s.selectionIcon}>{item.icon}</span>
            <span style={s.selectionTitle}>{item.label}</span>
            <span style={s.selectionCopy}>{item.sub}</span>
          </button>
        ))}
      </div>
      <p className={styles.sub} style={{ textAlign: 'center', marginTop: 8 }}>
        {sport === 'basketball' ? 'Basketball' : 'Football'} is ready — choose a tournament flavor to continue.
      </p>
    </div>
  );
}

// ─── Create ───────────────────────────────────────────────────────────────────

function CreateView({ form, setForm, onSubmit, loading }) {
  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  return (
    <div style={s.formCard}>
      <FormSection label="Tournament Name">
        <input
          className={styles.input}
          placeholder="Tournament name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={40}
        />
      </FormSection>

      <FormSection label="Sport">
        <div style={s.segmented}>
          {[
            { val: "football", icon: "⚽", label: "Football" },
            { val: "basketball", icon: "🏀", label: "Basketball" },
          ].map(({ val, icon, label }) => (
            <button
              key={val}
              style={{ ...s.segBtn, ...(form.sport === val ? s.segBtnActive : {}) }}
              onClick={() => set("sport", val)}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection label="Visibility">
        <div style={s.segmented}>
          {[
            { val: "private", icon: "🔒", label: "Private" },
            { val: "public", icon: "🌍", label: "Public" },
          ].map(({ val, icon, label }) => (
            <button
              key={val}
              style={{ ...s.segBtn, ...(form.visibility === val ? s.segBtnActive : {}) }}
              onClick={() => set("visibility", val)}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection label="Max Players">
        <div style={s.segmented}>
          {[4, 8, 16, 32].map((n) => (
            <button
              key={n}
              style={{ ...s.segBtn, ...(form.maxPlayers === n ? s.segBtnActive : {}) }}
              onClick={() => set("maxPlayers", n)}
            >
              {n}
            </button>
          ))}
        </div>
      </FormSection>

      <div style={s.inlineRow}>
        <FormSection label="Start Date" style={{ flex: 1 }}>
          <input className={styles.input} type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </FormSection>
        <FormSection label="Start Time" style={{ flex: 1 }}>
          <input className={styles.input} type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
        </FormSection>
      </div>

      <button className={styles.inviteBtn} style={s.primaryBtn} onClick={onSubmit} disabled={loading}>
        {loading ? "Creating…" : "Create Tournament ▶"}
      </button>
    </div>
  );
}

// ─── Join ─────────────────────────────────────────────────────────────────────

function JoinView({ joinCode, setJoinCode, onJoin, loading }) {
  return (
    <div style={s.joinCard}>
      <div style={{ fontSize: 40 }}>🔑</div>
      <input
        style={s.codeInput}
        placeholder="ABC123"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        maxLength={6}
      />
      <p className={styles.sub} style={{ textAlign: 'center', marginBottom: 0 }}>
        Codes are always 6 characters long.
      </p>
      <button
        className={styles.inviteBtn}
        style={s.primaryBtn}
        onClick={onJoin}
        disabled={loading || joinCode.trim().length < 6}
      >
        {loading ? "Joining…" : "Join Tournament ▶"}
      </button>
    </div>
  );
}

// ─── Browse ───────────────────────────────────────────────────────────────────

function BrowseView({ list, onJoin, loading }) {
  if (loading) return (
    <div style={s.centeredMsg}>
      <p className={styles.sub}>Loading tournaments…</p>
    </div>
  );

  if (list.length === 0) return (
    <div style={s.centeredMsg}>
      <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>🔍</span>
      <p className={styles.sub}>No public tournaments right now.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <p className={styles.kicker}>Public Tournaments</p>
      {list.map((t) => (
        <div key={t.code} style={s.browseCard}>
          <div style={s.browseCardLeft}>
            <div style={s.browseCardName}>{t.name}</div>
            <div style={s.browseCardMeta}>
              {t.sport === "football" ? "⚽" : "🏀"} · {TOURNAMENT_FORMATS[t.format]?.label || 'Standard Bracket'} · {Object.keys(t.players || {}).length}/{t.maxPlayers} players ·{" "}
              {new Date(t.startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <button className={styles.inviteBtn} style={s.joinSmBtn} onClick={() => onJoin(t.code)} disabled={loading}>
            Join
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Lobby ────────────────────────────────────────────────────────────────────

function LobbyView({ tournament, tournamentCode, currentUid, onStart, loading }) {
  const players = tournament.players || {};
  const playerList = Object.entries(players);
  const isHost = tournament.host === currentUid;
  const playerCount = playerList.length;
  const maxPlayers = tournament.maxPlayers;
  const canStart = isHost && playerCount >= MIN_START_PLAYERS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Code banner */}
      <div style={s.codeBanner}>
        <div style={s.codeLabel}>TOURNAMENT CODE</div>
        <div style={s.codeValue}>{tournamentCode}</div>
        <div style={s.codeHint}>Share this code to invite players</div>
      </div>

      {/* Info pills */}
      <div style={s.pillRow}>
        <Pill icon={tournament.sport === "football" ? "⚽" : "🏀"} text={tournament.sport} />
        <Pill icon={TOURNAMENT_FORMATS[tournament.format]?.icon || '🏆'} text={TOURNAMENT_FORMATS[tournament.format]?.label || 'Standard Bracket'} />
        <Pill icon="👥" text={`${playerCount} / ${maxPlayers}`} />
        <Pill icon={tournament.visibility === "public" ? "🌍" : "🔒"} text={tournament.visibility} />
      </div>

      {/* Player list */}
      <p className={styles.kicker}>Players ({playerCount}/{maxPlayers})</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {playerList.map(([uid, p]) => (
          <div key={uid} style={s.playerRow}>
            <div style={s.playerAvatar}>{(p.name || "?")[0].toUpperCase()}</div>
            <div style={s.playerName}>{p.name}</div>
            {uid === tournament.host && <span style={s.hostBadge}>HOST</span>}
            {uid === currentUid && <span style={s.youBadge}>YOU</span>}
          </div>
        ))}
        {Array.from({ length: maxPlayers - playerCount }).map((_, i) => (
          <div key={`empty-${i}`} style={{ ...s.playerRow, opacity: 0.25 }}>
            <div style={{ ...s.playerAvatar, background: "var(--pitch-light)" }}>?</div>
            <div style={{ ...s.playerName, fontStyle: "italic", color: "var(--trn-muted)" }}>Waiting…</div>
          </div>
        ))}
      </div>

      {/* Host controls / waiting */}
      {isHost ? (
        <button
          className={styles.inviteBtn}
          style={{ ...s.primaryBtn, opacity: canStart ? 1 : 0.45, marginTop: 8 }}
          onClick={onStart}
          disabled={!canStart || loading}
        >
          {loading ? "Starting…" : canStart ? "Start Tournament ▶" : `Need at least ${MIN_START_PLAYERS} players (${playerCount}/${MIN_START_PLAYERS})`}
        </button>
      ) : (
        <div style={s.waitingRow}>
          <div className="trn-dots"><span /><span /><span /></div>
          <span style={s.waitingText}>Waiting for the host to start…</span>
        </div>
      )}
    </div>
  );
}

// ─── Bracket ──────────────────────────────────────────────────────────────────

function BracketView({ tournament, tournamentCode, currentUid, onMatchClick }) {
  const players = tournament.players || {};
  const isComplete = tournament.status === "complete";
  const myMatch = findPlayerMatch(tournament.bracket, currentUid);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Status bar */}
      <div style={s.statusBar}>
        <span style={s.statusSport}>
          {tournament.sport === "football" ? "⚽" : "🏀"} {tournament.sport}
        </span>
        <span style={{
          ...s.statusPill,
          background: isComplete ? "rgba(245,200,66,0.15)" : "rgba(0,255,135,0.1)",
          color: isComplete ? "var(--trn-gold)" : "var(--accent)",
          border: `1px solid ${isComplete ? "rgba(245,200,66,0.3)" : "rgba(0,255,135,0.2)"}`,
        }}>
          {isComplete ? "🏁 Complete" : "⚡ Live"}
        </span>
      </div>

      {/* Nudge */}
      {myMatch && !isComplete && (
        <div style={s.nudge}>
          <span style={{ fontSize: 14 }}>▶</span>
          Your match is ready — tap the glowing card to play!
        </div>
      )}

      {/* Winner banner */}
      {isComplete && tournament.winner && (
        <div style={s.winnerBanner}>
          🏆 {players[tournament.winner]?.name || "Champion"} wins the tournament!
        </div>
      )}

      <TournamentBracket
        bracket={tournament.bracket}
        players={players}
        currentUid={currentUid}
        winner={tournament.winner}
        onMatchClick={onMatchClick}
      />
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function FormSection({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px", ...style }}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function Pill({ icon, text }) {
  return (
    <div style={s.pill}>
      <span>{icon}</span>
      <span style={s.pillText}>{text}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  // Forms
  formCard: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    padding: "18px",
    border: "1px solid var(--card-border)",
    borderRadius: "16px",
    background: "var(--pitch-mid)",
    fontFamily: "var(--font-body)",
  },
  selectionStack: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  selectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },
  selectionCard: {
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    borderRadius: "14px",
    padding: "14px",
    textAlign: "left",
    minHeight: "120px",
    color: "inherit",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  selectionCardActive: {
    border: "1px solid var(--green)",
    background: "color-mix(in srgb, var(--green) 10%, var(--card-bg))",
    boxShadow: "0 0 0 1px rgba(0,255,135,0.18) inset",
  },
  selectionIcon: {
    fontSize: "22px",
    lineHeight: 1,
  },
  selectionTitle: {
    color: "var(--white)",
    fontSize: "15px",
    fontWeight: 800,
    lineHeight: 1.1,
  },
  selectionCopy: {
    color: "var(--muted)",
    fontSize: "12px",
    lineHeight: 1.45,
  },
  modeBanner: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    marginBottom: "12px",
    borderRadius: "14px",
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
  },
  modeBannerIcon: {
    fontSize: "24px",
    flexShrink: 0,
  },
  modeBannerText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  modeBannerEyebrow: {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--muted)",
  },
  modeBannerCopy: {
    fontSize: "13px",
    color: "var(--white)",
    fontWeight: 700,
  },
  hubGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
  },
  hubCard: {
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    borderRadius: "14px",
    padding: "10px 10px 11px",
    textAlign: "left",
    minWidth: 0,
    minHeight: "112px",
    color: "inherit",
  },
  hubIcon: {
    fontSize: "16px",
  },
  hubCardTitle: {
    display: "block",
    marginTop: "6px",
    color: "var(--white)",
    fontSize: "14px",
    fontWeight: 800,
    lineHeight: 1.1,
  },
  hubCardCopy: {
    display: "block",
    marginTop: "6px",
    color: "var(--muted)",
    fontSize: "11px",
    lineHeight: 1.35,
  },
  fieldLabel: {
    fontFamily: "var(--font-body)",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--muted)",
  },
  input: {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
    padding: "12px 14px",
    color: "var(--white)",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    fontWeight: 600,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    colorScheme: "dark",
  },
  segmented: { display: "flex", gap: "8px", flexWrap: "wrap" },
  segBtn: {
    flex: "1 1 auto",
    background: "var(--pitch)",
    border: "1px solid var(--card-border)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "var(--muted)",
    fontFamily: "var(--font-body)",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.03em",
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  segBtnActive: {
    background: "rgba(0,255,135,0.1)",
    border: "1px solid var(--green)",
    color: "var(--green)",
  },
  primaryBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 800,
    letterSpacing: "0.04em",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: "14px",
  },
  heroCard: {
    padding: "18px 18px 16px",
    borderRadius: "18px",
    border: "1px solid var(--card-border)",
    background:
      "radial-gradient(circle at top right, color-mix(in srgb, var(--green) 12%, transparent), transparent 40%), var(--card-bg)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    marginBottom: "18px",
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "28px",
    padding: "0 10px",
    borderRadius: "999px",
    border: "1px solid var(--card-border)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--muted)",
    fontSize: "12px",
    fontWeight: 700,
  },

  // Join
  joinCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  codeInput: {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    padding: "14px 12px",
    color: "var(--green)",
    fontFamily: "var(--font-body)",
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "0.24em",
    textAlign: "center",
    textTransform: "uppercase",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    colorScheme: "dark",
  },

  // Browse
  centeredMsg: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 0",
    textAlign: "center",
  },
  browseCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  browseCardLeft: { display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 },
  browseCardName: {
    fontFamily: "var(--font-body)",
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--white)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  browseCardMeta: { fontSize: "12px", color: "var(--muted)" },
  joinSmBtn: {
    padding: "8px 18px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 800,
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  },

  // Lobby
  codeBanner: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    padding: "22px",
    textAlign: "center",
  },
  codeLabel: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: "6px",
  },
  codeValue: {
    fontFamily: "var(--font-body)",
    fontSize: "42px",
    fontWeight: 900,
    letterSpacing: "0.25em",
    color: "var(--green)",
    lineHeight: 1,
    marginBottom: "6px",
  },
  codeHint: { fontSize: "12px", color: "var(--muted)" },
  pillRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "20px",
    padding: "5px 12px",
    fontSize: "12px",
  },
  pillText: {
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: "var(--muted)",
    textTransform: "capitalize",
  },
  playerRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "10px",
    padding: "10px 14px",
  },
  playerAvatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(0,255,135,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-body)",
    fontWeight: 800,
    fontSize: "14px",
    color: "var(--green)",
    flexShrink: 0,
  },
  playerName: {
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--white)",
    flex: 1,
  },
  hostBadge: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.1em",
    color: "var(--trn-gold)",
    background: "rgba(245,200,66,0.1)",
    border: "1px solid rgba(245,200,66,0.2)",
    borderRadius: "4px",
    padding: "2px 7px",
  },
  youBadge: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.1em",
    color: "var(--green)",
    background: "rgba(0,255,135,0.08)",
    border: "1px solid rgba(0,255,135,0.2)",
    borderRadius: "4px",
    padding: "2px 7px",
  },
  waitingRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    justifyContent: "center",
    paddingTop: "16px",
  },
  waitingText: {
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    letterSpacing: "0.06em",
    color: "var(--muted)",
  },
  startBlock: {
    marginTop: "10px",
  },
  inlineRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  // Bracket
  statusBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusSport: {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--muted)",
  },
  statusPill: {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    padding: "4px 11px",
    borderRadius: "20px",
  },
  nudge: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "var(--green)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  winnerBanner: {
    background: "var(--card-bg)",
    border: "1px solid rgba(245,200,66,0.25)",
    borderRadius: "12px",
    padding: "14px 18px",
    fontFamily: "var(--font-body)",
    fontSize: "17px",
    fontWeight: 800,
    letterSpacing: "0.04em",
    color: "var(--trn-gold)",
    textAlign: "center",
  },
};

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

export default function Tournament({ user, onBack, onPlayMatch, initialCode }) {
  const [view, setView] = useState(initialCode ? "bracket" : "hub");
  const [tournament, setTournament] = useState(null);
  const [tournamentCode, setTournamentCode] = useState(initialCode || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [publicList, setPublicList] = useState([]);
  const unsubRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    sport: "football",
    visibility: "private",
    maxPlayers: 8,
    startDate: "",
    startTime: "",
  });

  const [joinCode, setJoinCode] = useState("");

  const subscribeTo = useCallback((code) => {
    if (unsubRef.current) unsubRef.current();
    const unsub = subscribeTournament(code, (data) => {
      if (data) {
        setTournament(data);
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
    if (view === "hub") {
      onBack();
    } else {
      setView("hub");
      setError("");
    }
  }

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={handleBack}>
          Back
        </button>
        <div style={s.headerTitle}>
          {view === "hub" && "Tournaments"}
          {view === "create" && "Create"}
          {view === "join" && "Join"}
          {view === "browse" && "Browse"}
          {view === "lobby" && (tournament?.name || "Lobby")}
          {view === "bracket" && (tournament?.name || "Bracket")}
        </div>
        <div style={{ width: 60 }} />
      </div>

      {error && <div style={s.errorBanner}>⚠ {error}</div>}

      {view === "hub" && (
        <HubView
          onCreate={() => { setError(""); setView("create"); }}
          onJoin={() => { setError(""); setView("join"); }}
          onBrowse={handleBrowse}
          loading={loading}
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

function HubView({ onCreate, onJoin, onBrowse, loading }) {
  return (
    <div style={s.hubWrap}>
      <div style={s.hubHero}>
        <div style={s.hubTrophyWrap}>
          <div style={s.hubTrophyGlow} />
          <span style={s.hubTrophy}>🏆</span>
        </div>
        <h1 style={s.hubHeading}>COMPETE &<br />CONQUER</h1>
        <p style={s.hubSub}>
          Single-elimination tournaments.<br />Real-time 1v1 matches. One champion.
        </p>
      </div>

      <div style={s.hubCards}>
        {[
          { key: "create", icon: "⚡", label: "CREATE", desc: "Host your own tournament", cls: "trn-hub-card--create", action: onCreate },
          { key: "join", icon: "🔑", label: "JOIN", desc: "Enter a tournament code", cls: "trn-hub-card--join", action: onJoin },
          { key: "browse", icon: "🌍", label: "BROWSE", desc: "Find public tournaments", cls: "trn-hub-card--browse", action: onBrowse },
        ].map(({ key, icon, label, desc, cls, action }) => (
          <button key={key} className={`trn-hub-card ${cls}`} onClick={action} disabled={loading}>
            <span style={s.hubCardIcon}>{icon}</span>
            <div style={s.hubCardText}>
              <span style={s.hubCardLabel}>{label}</span>
              <span style={s.hubCardDesc}>{desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Create ───────────────────────────────────────────────────────────────────

function CreateView({ form, setForm, onSubmit, loading }) {
  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  return (
    <div style={s.scrollWrap}>
      <div style={s.formCard}>

        <FormSection label="Tournament Name">
          <input
            style={s.input}
            placeholder="e.g. Friday Night Cup"
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

        <div style={{ display: "flex", gap: "12px" }}>
          <FormSection label="Start Date" style={{ flex: 1 }}>
            <input style={s.input} type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </FormSection>
          <FormSection label="Start Time" style={{ flex: 1 }}>
            <input style={s.input} type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </FormSection>
        </div>

        <button style={{ ...s.primaryBtn, marginTop: "8px" }} onClick={onSubmit} disabled={loading}>
          {loading ? "Creating…" : "Create Tournament ▶"}
        </button>
      </div>
    </div>
  );
}

// ─── Join ─────────────────────────────────────────────────────────────────────

function JoinView({ joinCode, setJoinCode, onJoin, loading }) {
  return (
    <div style={s.centeredWrap}>
      <div style={s.joinCard}>
        <div style={s.joinIcon}>🔑</div>
        <h2 style={s.joinTitle}>Enter Code</h2>
        <p style={s.joinHint}>Get the 6-character code from your tournament host.</p>
        <input
          style={s.codeInput}
          placeholder="ABC123"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={6}
        />
        <button
          style={{ ...s.primaryBtn, marginTop: "8px" }}
          onClick={onJoin}
          disabled={loading || joinCode.length < 4}
        >
          {loading ? "Joining…" : "Join Tournament ▶"}
        </button>
      </div>
    </div>
  );
}

// ─── Browse ───────────────────────────────────────────────────────────────────

function BrowseView({ list, onJoin, loading }) {
  if (loading) return <div style={s.centeredMsg}>Loading tournaments…</div>;
  if (list.length === 0) return (
    <div style={s.centeredMsg}>
      <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>🔍</span>
      No public tournaments right now.
    </div>
  );

  return (
    <div style={s.scrollWrap}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {list.map((t) => (
          <div key={t.code} style={s.browseCard}>
            <div style={s.browseCardLeft}>
              <div style={s.browseCardName}>{t.name}</div>
              <div style={s.browseCardMeta}>
                {t.sport === "football" ? "⚽" : "🏀"} · {Object.keys(t.players || {}).length}/{t.maxPlayers} players ·{" "}
                {new Date(t.startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <button style={s.joinSmBtn} onClick={() => onJoin(t.code)} disabled={loading}>Join</button>
          </div>
        ))}
      </div>
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
  const canStart = isHost && playerCount >= 4;

  return (
    <div style={s.scrollWrap}>
      {/* Code banner */}
      <div style={s.codeBanner}>
        <div style={s.codeLabel}>TOURNAMENT CODE</div>
        <div style={s.codeValue}>{tournamentCode}</div>
        <div style={s.codeHint}>Share this code to invite players</div>
      </div>

      {/* Info pills */}
      <div style={s.pillRow}>
        <Pill icon={tournament.sport === "football" ? "⚽" : "🏀"} text={tournament.sport} />
        <Pill icon="👥" text={`${playerCount} / ${maxPlayers}`} />
        <Pill icon={tournament.visibility === "public" ? "🌍" : "🔒"} text={tournament.visibility} />
      </div>

      {/* Player list */}
      <div style={s.sectionTitle}>PLAYERS ({playerCount}/{maxPlayers})</div>
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
        <div style={{ marginTop: "auto", paddingTop: "20px" }}>
          <button
            style={{ ...s.primaryBtn, opacity: canStart ? 1 : 0.45 }}
            onClick={onStart}
            disabled={!canStart || loading}
          >
            {loading ? "Starting…" : canStart ? "Start Tournament ▶" : `Need at least 4 players (${playerCount}/4)`}
          </button>
        </div>
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
    <div style={s.bracketWrap}>
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
          <span style={s.nudgeIcon}>▶</span>
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
   page: {
     minHeight: "100vh",
     background: "var(--pitch)",
     color: "var(--trn-text)",
     fontFamily: "var(--font-body)",
     display: "flex",
     flexDirection: "column",
     maxWidth: 760,
     margin: "0 auto",
     padding: "2rem 1.25rem 4rem",
   },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: "1px solid var(--trn-border)",
    background: "rgba(0,0,0,0.15)",
    backdropFilter: "blur(8px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    background: "var(--accent)",
    border: "none",
    color: "var(--pitch)",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "normal",
    cursor: "pointer",
    padding: "0.8rem 1.2rem",
    borderRadius: "12px",
    transition: "background 0.2s, transform 0.1s",
    width: "auto",
    textAlign: "center",
  },
  headerTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "none",
    color: "var(--trn-text)",
  },
  errorBanner: {
    background: "rgba(255,79,79,0.1)",
    border: "1px solid rgba(255,79,79,0.25)",
    borderRadius: "8px",
    margin: "12px 20px 0",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#ff7a7a",
  },

  // Hub
  hubWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "36px 20px 32px",
    gap: "36px",
  },
  hubHero: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
  },
  hubTrophyWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
  },
  hubTrophyGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(245,200,66,0.25) 0%, transparent 70%)",
    filter: "blur(8px)",
  },
  hubTrophy: { fontSize: "56px", position: "relative" },
  hubHeading: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(42px, 9vw, 64px)",
    fontWeight: 800,
    letterSpacing: "0.01em",
    lineHeight: 1.05,
    margin: 0,
    background: "linear-gradient(135deg, #fff 40%, var(--accent))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  hubSub: {
    fontSize: "14px",
    color: "var(--trn-muted)",
    margin: 0,
    lineHeight: 1.6,
  },
  hubCards: {
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    width: "100%",
    maxWidth: 760,
    overflowX: "auto",
    paddingBottom: "4px",
    scrollbarWidth: "none",
  },
  hubCardIcon: { fontSize: "18px", flexShrink: 0 },
  hubCardText: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  hubCardLabel: {
    fontFamily: "var(--font-body)",
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "0.02em",
    color: "var(--trn-text)",
  },
  hubCardDesc: { fontSize: "13px", lineHeight: 1.45, color: "var(--trn-muted)" },

  // Forms
  scrollWrap: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: 480,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  formCard: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  fieldLabel: {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--trn-muted)",
  },
  input: {
    background: "var(--pitch-mid)",
    border: "1px solid var(--trn-border)",
    borderRadius: "10px",
    padding: "11px 14px",
    color: "var(--trn-text)",
    fontFamily: "var(--font-body)",
    fontSize: "15px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    colorScheme: "dark",
    transition: "border-color 0.15s",
  },
  segmented: { display: "flex", gap: "8px", flexWrap: "wrap" },
  segBtn: {
    flex: "1 1 auto",
    background: "var(--pitch-mid)",
    border: "1px solid var(--trn-border)",
    borderRadius: "8px",
    padding: "9px 12px",
    color: "var(--trn-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  segBtnActive: {
    background: "rgba(0,255,135,0.1)",
    border: "1px solid var(--accent)",
    color: "var(--accent)",
  },
  primaryBtn: {
    background: "var(--accent)",
    color: "var(--pitch)",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontFamily: "var(--font-body)",
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    cursor: "pointer",
    width: "100%",
    transition: "opacity 0.15s, transform 0.1s",
  },

  // Join
  centeredWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 20px",
  },
  joinCard: {
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
    background: "var(--pitch-mid)",
    border: "1px solid var(--trn-border)",
    borderRadius: "20px",
    padding: "32px 24px",
  },
  joinIcon: { fontSize: "40px" },
  joinTitle: {
    fontFamily: "var(--font-body)",
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "0.06em",
    margin: 0,
    color: "var(--trn-text)",
  },
  joinHint: {
    fontSize: "13px",
    color: "var(--trn-muted)",
    margin: 0,
    textAlign: "center",
    lineHeight: 1.5,
  },
  codeInput: {
    background: "rgba(0,255,135,0.05)",
    border: "2px solid var(--trn-border)",
    borderRadius: "12px",
    padding: "14px",
    color: "var(--accent)",
    fontFamily: "var(--font-body)",
    fontSize: "28px",
    fontWeight: 800,
    letterSpacing: "0.3em",
    textAlign: "center",
    textTransform: "uppercase",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    colorScheme: "dark",
    transition: "border-color 0.15s",
  },

  // Browse
  centeredMsg: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--trn-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "15px",
    padding: "40px 20px",
    textAlign: "center",
  },
  browseCard: {
    background: "var(--pitch-mid)",
    border: "1px solid var(--trn-border)",
    borderRadius: "12px",
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
    color: "var(--trn-text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  browseCardMeta: { fontSize: "12px", color: "var(--trn-muted)" },
  joinSmBtn: {
    background: "var(--accent)",
    color: "var(--pitch)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 18px",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "0.06em",
    cursor: "pointer",
    flexShrink: 0,
  },

  // Lobby
  codeBanner: {
    background: "linear-gradient(135deg, rgba(0,255,135,0.07), rgba(0,255,135,0.02))",
    border: "1px solid rgba(0,255,135,0.2)",
    borderRadius: "16px",
    padding: "22px",
    textAlign: "center",
  },
  codeLabel: {
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--trn-muted)",
    marginBottom: "6px",
  },
  codeValue: {
    fontFamily: "var(--font-body)",
    fontSize: "42px",
    fontWeight: 900,
    letterSpacing: "0.25em",
    color: "var(--accent)",
    lineHeight: 1,
    marginBottom: "6px",
  },
  codeHint: { fontSize: "12px", color: "var(--trn-muted)" },
  pillRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "var(--pitch-mid)",
    border: "1px solid var(--trn-border)",
    borderRadius: "20px",
    padding: "5px 12px",
    fontSize: "12px",
  },
  pillText: {
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: "var(--trn-muted)",
    textTransform: "capitalize",
  },
  sectionTitle: {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--trn-muted)",
  },
  playerRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "var(--pitch-mid)",
    border: "1px solid var(--trn-border)",
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
    color: "var(--accent)",
    flexShrink: 0,
  },
  playerName: {
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--trn-text)",
    flex: 1,
  },
  hostBadge: {
    fontFamily: "var(--font-body)",
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
    fontFamily: "var(--font-body)",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.1em",
    color: "var(--accent)",
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
    marginTop: "auto",
    paddingTop: "24px",
  },
  waitingText: {
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    letterSpacing: "0.06em",
    color: "var(--trn-muted)",
  },

  // Bracket
  bracketWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingTop: "16px",
  },
  statusBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
  },
  statusSport: {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--trn-muted)",
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
    margin: "0 20px",
    background: "rgba(0,255,135,0.07)",
    border: "1px solid rgba(0,255,135,0.18)",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "var(--accent)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  nudgeIcon: { fontSize: "14px" },
  winnerBanner: {
    margin: "0 20px",
    background: "linear-gradient(135deg, rgba(245,200,66,0.1), rgba(245,200,66,0.03))",
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

const css = `
  :root {
    --trn-border:  var(--pitch-light, #1a3d24);
    --trn-text:    #e8eaf0;
    --trn-muted:   var(--muted, rgba(245,245,240,0.5));
    --trn-gold:    #f5c842;
    --trn-subtext: #8b8fa8;
  }

  .trn-hub-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 14px;
    padding: 14px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    text-align: left;
    color: var(--trn-text);
    min-width: 210px;
    flex: 0 0 210px;
  }

  .trn-hub-card:active { transform: scale(0.98); }

  .trn-hub-card--create:hover {
    border-color: var(--accent);
    background: rgba(255,255,255,0.06);
  }
  .trn-hub-card--join:hover {
    border-color: var(--accent);
    background: rgba(255,255,255,0.06);
  }
  .trn-hub-card--browse:hover {
    border-color: var(--accent);
    background: rgba(255,255,255,0.06);
  }

  @media (max-width: 520px) {
    .trn-hub-card {
      min-width: 185px;
      flex-basis: 185px;
    }
  }

  .trn-dots { display: flex; gap: 5px; }
  .trn-dots span {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--trn-muted);
    animation: trn-bounce 1.4s ease-in-out infinite;
  }
  .trn-dots span:nth-child(2) { animation-delay: 0.2s; }
  .trn-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes trn-bounce {
    0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
    40%            { transform: scale(1);   opacity: 1; }
  }

  input[type="text"]:focus,
  input[type="date"]:focus,
  input[type="time"]:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 2px rgba(0,255,135,0.12);
  }

  button[disabled] { opacity: 0.45; cursor: not-allowed; }
`;



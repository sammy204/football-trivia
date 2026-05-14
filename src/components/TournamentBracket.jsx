import { useEffect, useRef } from "react";
import { getRoundLabel, getPlayerName } from "../lib/tournament";

export default function TournamentBracket({
  bracket,
  players,
  currentUid,
  winner,
  onMatchClick,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, []);

  if (!bracket || bracket.length === 0) {
    return (
      <div style={st.empty}>
        <span style={{ fontSize: "36px" }}>⏳</span>
        <p style={st.emptyText}>Bracket will appear once the tournament starts.</p>
      </div>
    );
  }

  const totalRounds = bracket.length;

  return (
    <div style={st.wrapper}>
      <style>{bracketCSS}</style>
      <div style={st.scrollArea} ref={scrollRef}>
        <div style={st.bracketRow}>
          {bracket.map((round, roundIndex) => (
            <div key={roundIndex} style={st.roundCol}>
              <div style={st.roundLabel}>
                {getRoundLabel(totalRounds, roundIndex)}
              </div>
              <div style={{
                ...st.matchList,
                gap: getGap(roundIndex),
                paddingTop: getPadding(roundIndex),
              }}>
                {round.map((match, matchIndex) => (
                  <MatchCard
                    key={matchIndex}
                    match={match}
                    matchIndex={matchIndex}
                    roundIndex={roundIndex}
                    players={players}
                    currentUid={currentUid}
                    totalRounds={totalRounds}
                    onMatchClick={onMatchClick}
                    isLastRound={roundIndex === totalRounds - 1}
                  />
                ))}
              </div>
            </div>
          ))}

          {winner && (
            <div style={st.roundCol}>
              <div style={{ ...st.roundLabel, color: "var(--trn-gold)" }}>
                🏆 Champion
              </div>
              <div style={{ ...st.matchList, paddingTop: getPadding(totalRounds) }}>
                <WinnerCard uid={winner} players={players} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ match, matchIndex, roundIndex, players, currentUid, onMatchClick, isLastRound }) {
  const { p1, p2, winner, status, roomCode } = match;

  const p1Name = getPlayerName(players, p1);
  const p2Name = getPlayerName(players, p2);

  const isBye = p2 === "BYE";
  const isComplete = status === "complete";
  const isActive = status === "active";
  const isPending = status === "pending";

  const involvesCurrent = currentUid && (p1 === currentUid || p2 === currentUid);
  const currentLost = isComplete && involvesCurrent && winner !== currentUid;

  const isPlayable =
    involvesCurrent && !isBye && !isComplete && roomCode &&
    p1 !== null && p1 !== undefined &&
    p2 !== null && p2 !== undefined;

  function handleClick() {
    if (isPlayable && onMatchClick) onMatchClick({ roundIndex, matchIndex, match });
  }

  let cls = "trn-match";
  if (involvesCurrent) cls += " trn-match--mine";
  if (isComplete) cls += " trn-match--done";
  if (isActive) cls += " trn-match--active";
  if (isPlayable) cls += " trn-match--playable";
  if (currentLost) cls += " trn-match--lost";
  if (!isLastRound) cls += " trn-match--connector";

  return (
    <div className={cls} onClick={handleClick}>
      {/* Status indicator */}
      <div className="trn-pip">
        {isComplete ? "✓" : isActive ? "⚡" : "·"}
      </div>

      <PlayerRow
        uid={p1} name={p1Name}
        isWinner={isComplete && winner === p1}
        isLoser={isComplete && winner !== p1 && p1 !== "BYE"}
        isCurrent={p1 === currentUid}
        isEmpty={!p1}
      />

      <div className="trn-divider" />

      <PlayerRow
        uid={p2} name={p2Name}
        isWinner={isComplete && winner === p2}
        isLoser={isComplete && winner !== p2 && p2 !== "BYE"}
        isCurrent={p2 === currentUid}
        isEmpty={!p2}
        isBye={isBye}
      />

      {isPlayable && <div className="trn-play-btn">PLAY ▶</div>}
      {!isPlayable && !isComplete && involvesCurrent && (
        <div className="trn-waiting">WAITING…</div>
      )}
    </div>
  );
}

function PlayerRow({ uid, name, isWinner, isLoser, isCurrent, isEmpty, isBye }) {
  let cls = "trn-player";
  if (isWinner) cls += " trn-player--winner";
  if (isLoser) cls += " trn-player--loser";
  if (isCurrent) cls += " trn-player--me";
  if (isEmpty || isBye) cls += " trn-player--dim";

  return (
    <div className={cls}>
      {isCurrent && !isEmpty && <span className="trn-player-dot" />}
      <span className="trn-player-name">
        {isEmpty || name === "null" ? "TBD" : isBye ? "BYE" : name}
      </span>
      {isWinner && <span className="trn-crown">👑</span>}
    </div>
  );
}

function WinnerCard({ uid, players }) {
  const name = getPlayerName(players, uid);
  return (
    <div className="trn-winner">
      <div className="trn-winner__rays" />
      <div className="trn-winner__trophy">🏆</div>
      <div className="trn-winner__name">{name}</div>
      <div className="trn-winner__label">Tournament Champion</div>
    </div>
  );
}

// ─── Layout math ──────────────────────────────────────────────────────────────

function getGap(roundIndex) {
  return `${12 + roundIndex * 52}px`;
}

function getPadding(roundIndex) {
  if (roundIndex === 0) return "0px";
  return `${26 + (roundIndex - 1) * 26}px`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = {
  wrapper: { width: "100%", position: "relative" },
  scrollArea: {
    overflowX: "auto",
    overflowY: "visible",
    paddingBottom: "24px",
    WebkitOverflowScrolling: "touch",
  },
  bracketRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    minWidth: "max-content",
    padding: "8px 20px 24px",
  },
  roundCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "175px",
  },
  roundLabel: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--trn-muted, rgba(245,245,240,0.5))",
    marginBottom: "14px",
    whiteSpace: "nowrap",
  },
  matchList: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "56px 24px",
    gap: "12px",
    color: "var(--trn-muted, rgba(245,245,240,0.5))",
  },
  emptyText: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: "14px",
    textAlign: "center",
    margin: 0,
  },
};

// ─── CSS ──────────────────────────────────────────────────────────────────────

const bracketCSS = `
  :root {
    --trn-border: var(--pitch-light, #1a3d24);
    --trn-surface: var(--pitch-mid, #0f2d18);
    --trn-accent: var(--accent, #00FF87);
    --trn-gold: #f5c842;
    --trn-muted: var(--muted, rgba(245,245,240,0.5));
    --trn-text: #e8eaf0;
  }

  /* ── Card base ── */
  .trn-match {
    position: relative;
    width: 155px;
    background: var(--trn-surface);
    border: 1px solid var(--trn-border);
    border-radius: 12px;
    padding: 10px 12px 10px;
    cursor: default;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s, opacity 0.2s;
    overflow: visible;
  }

  /* Connector line to next round */
  .trn-match--connector::after {
    content: '';
    position: absolute;
    right: -20px;
    top: 50%;
    width: 20px;
    height: 1px;
    background: var(--trn-border);
    pointer-events: none;
  }

  /* Subtle glow overlay for "my match" */
  .trn-match::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    opacity: 0;
    background: linear-gradient(135deg, rgba(0,255,135,0.05), transparent);
    pointer-events: none;
    transition: opacity 0.2s;
  }

  .trn-match--mine { border-color: rgba(0,255,135,0.3); }
  .trn-match--mine::before { opacity: 1; }

  .trn-match--active {
    border-color: var(--trn-accent);
    box-shadow: 0 0 0 1px var(--trn-accent), 0 0 20px rgba(0,255,135,0.18);
    animation: trn-pulse 2.2s ease-in-out infinite;
  }

  .trn-match--done { opacity: 0.8; }

  .trn-match--playable {
    cursor: pointer;
    border-color: var(--trn-accent);
    box-shadow: 0 0 0 1px var(--trn-accent), 0 6px 28px rgba(0,255,135,0.22);
    animation: trn-pulse 2.2s ease-in-out infinite;
  }

  .trn-match--playable:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 0 1px var(--trn-accent), 0 10px 36px rgba(0,255,135,0.32);
  }

  .trn-match--playable:active { transform: translateY(0); }

  .trn-match--lost {
    opacity: 0.4;
    filter: grayscale(0.5);
  }

  /* Status pip */
  .trn-pip {
    position: absolute;
    top: 8px;
    right: 10px;
    font-size: 10px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    color: var(--trn-muted);
    letter-spacing: 0.05em;
  }

  .trn-match--done .trn-pip,
  .trn-match--active .trn-pip { color: var(--trn-accent); }

  /* Divider */
  .trn-divider {
    height: 1px;
    background: var(--trn-border);
    margin: 7px 0;
  }

  /* Play button */
  .trn-play-btn {
    margin-top: 9px;
    background: var(--trn-accent);
    color: #0a1f0f;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-align: center;
    padding: 5px 0;
    border-radius: 6px;
    transition: background 0.15s;
  }

  .trn-match--playable:hover .trn-play-btn { background: #00ffb3; }

  /* Waiting */
  .trn-waiting {
    margin-top: 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--trn-muted);
    text-align: center;
    text-transform: uppercase;
  }

  /* ── Player row ── */
  .trn-player {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
  }

  .trn-player-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--trn-accent);
    flex-shrink: 0;
  }

  .trn-player-name {
    font-family: 'Barlow', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--trn-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 108px;
  }

  .trn-crown {
    font-size: 11px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .trn-player--winner .trn-player-name {
    color: var(--trn-gold);
    font-weight: 700;
  }

  .trn-player--loser .trn-player-name {
    color: var(--trn-muted);
    text-decoration: line-through;
    font-weight: 400;
    opacity: 0.7;
  }

  .trn-player--me .trn-player-name { color: var(--trn-accent); }

  .trn-player--dim .trn-player-name {
    color: var(--trn-muted);
    font-style: italic;
    font-size: 11px;
  }

  /* ── Winner card ── */
  .trn-winner {
    position: relative;
    width: 155px;
    background: linear-gradient(160deg, #1e1a08, #2a2408);
    border: 1px solid rgba(245,200,66,0.4);
    border-radius: 14px;
    padding: 22px 14px 18px;
    text-align: center;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(245,200,66,0.15), 0 8px 40px rgba(245,200,66,0.12);
    animation: trn-winner-glow 3s ease-in-out infinite;
  }

  .trn-winner__rays {
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle at 50% 30%, rgba(245,200,66,0.12) 0%, transparent 65%);
    pointer-events: none;
  }

  .trn-winner__trophy {
    font-size: 30px;
    margin-bottom: 10px;
    position: relative;
    display: block;
  }

  .trn-winner__name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 17px;
    font-weight: 800;
    color: var(--trn-gold);
    letter-spacing: 0.04em;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
  }

  .trn-winner__label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(245,200,66,0.5);
    position: relative;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { height: 4px; width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: var(--trn-border);
    border-radius: 2px;
  }

  /* ── Animations ── */
  @keyframes trn-pulse {
    0%, 100% { box-shadow: 0 0 0 1px var(--trn-accent), 0 0 20px rgba(0,255,135,0.18); }
    50%       { box-shadow: 0 0 0 1px var(--trn-accent), 0 0 32px rgba(0,255,135,0.36); }
  }

  @keyframes trn-winner-glow {
    0%, 100% { box-shadow: 0 0 0 1px rgba(245,200,66,0.15), 0 8px 40px rgba(245,200,66,0.12); }
    50%       { box-shadow: 0 0 0 1px rgba(245,200,66,0.4),  0 8px 48px rgba(245,200,66,0.28); }
  }
`;
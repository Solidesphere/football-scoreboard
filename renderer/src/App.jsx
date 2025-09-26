import React, { useState, useEffect, useRef } from "react";
import { send, invoke } from "./ipc";

import Timer from "./components/Timer/Timer";
import ScoreControl from "./components/ScoreControl/ScoreControl";
import ScoreboardManager from "./components/ScoreboardManager/ScoreboardManager";
import useGameTimer from "./hooks/useGameTimer";
import ConfigPage from "./ConfigPage";

const containerStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  marginBottom: 30,
  boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
};

const sectionTitleStyle = {
  fontSize: "1.4rem",
  fontWeight: "700",
  marginBottom: 16,
};

const penaltyCircleStyle = (result) => ({
  display: "inline-block",
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: result === "goal" ? "#28a745" : "#dc3545",
  border: "2px solid #222",
  boxShadow: result === "goal" ? "0 0 6px #28a745cc" : "0 0 6px #dc3545cc",
  cursor: "pointer",
  position: "relative",
  color: "#fff",
  fontWeight: "bold",
  fontSize: "1.1rem",
  lineHeight: "32px",
  textAlign: "center",
  userSelect: "none",
});

function PenaltyCircle({ result, onClick }) {
  const icon = result === "goal" ? "✔" : "✖";
  return (
    <span
      style={penaltyCircleStyle(result)}
      onClick={onClick}
      title={result === "goal" ? "Goal" : "Miss"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      aria-pressed={result === "goal"}
      aria-label={result === "goal" ? "Goal scored" : "Missed penalty"}
    >
      {icon}
    </span>
  );
}

function AdditionalTimer({
  timeoutDuration,
  setTimeoutDuration,
  timeoutTimer,
  setTimeoutTimer,
  setTimeoutRunning,
  send,
  formatTimeout,
  buttonStyle,
}) {
  const [minutes, setMinutes] = useState(Math.floor(timeoutDuration / 60));
  const [seconds, setSeconds] = useState(timeoutDuration % 60);

  useEffect(() => {
    setMinutes(Math.floor(timeoutDuration / 60));
    setSeconds(timeoutDuration % 60);
  }, [timeoutDuration]);

  const updateDuration = (newMinutes, newSeconds) => {
    const clampedMinutes = Math.max(0, Math.min(60, newMinutes));
    const clampedSeconds = Math.max(0, Math.min(59, newSeconds));
    setMinutes(clampedMinutes);
    setSeconds(clampedSeconds);
    setTimeoutDuration(clampedMinutes * 60 + clampedSeconds);
  };

  return (
    <div
      style={{
        background: "#e9ecef",
        padding: 12,
        borderRadius: 8,
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 12 }}>Additional Timer</h3>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <span>Duration:</span>
        <input
          type="number"
          min={0}
          max={60}
          value={minutes}
          onChange={(e) => updateDuration(Number(e.target.value) || 0, seconds)}
          style={{ width: 40, fontSize: 16, padding: 4 }}
          title="Minutes"
        />
        <button
          onClick={() => updateDuration(minutes + 1, seconds)}
          style={buttonStyle("#0d6efd")}
          title="Add 1 Minute"
        >
          +1 min
        </button>
        <button
          onClick={() => updateDuration(minutes - 1, seconds)}
          style={buttonStyle("#0d6efd")}
          title="Subtract 1 Minute"
          disabled={minutes === 0}
        >
          -1 min
        </button>
        <span>min</span>

        <input
          type="number"
          min={0}
          max={59}
          value={seconds}
          onChange={(e) => updateDuration(minutes, Number(e.target.value) || 0)}
          style={{ width: 40, fontSize: 16, padding: 4 }}
          title="Seconds"
        />
        <button
          onClick={() => updateDuration(minutes, seconds + 1)}
          style={buttonStyle("#0d6efd")}
          title="Add 1 Second"
          disabled={seconds === 59}
        >
          +1 sec
        </button>
        <button
          onClick={() => updateDuration(minutes, seconds - 1)}
          style={buttonStyle("#0d6efd")}
          title="Subtract 1 Second"
          disabled={seconds === 0}
        >
          -1 sec
        </button>
        <span>sec</span>

        <button
          onClick={() => {
            setTimeoutTimer(0);
            setTimeoutRunning(true);
            send("update-timeout", 0);
          }}
          style={buttonStyle("#198754", true)}
        >
          Start
        </button>
        <button
          onClick={() => setTimeoutRunning(false)}
          style={buttonStyle("#6c757d")}
        >
          Pause
        </button>
        <button
          onClick={() => {
            setTimeoutRunning(false);
            setTimeoutTimer(0);
            send("update-timeout", 0);
          }}
          style={buttonStyle("#dc3545")}
        >
          Reset
        </button>
      </div>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {formatTimeout(timeoutTimer)}
      </div>
    </div>
  );
}

export default function App() {
  const [scoreboards, setScoreboards] = useState([]);
  const [displays, setDisplays] = useState([]);
  const [selectedDisplay, setSelectedDisplay] = useState(0);
  const [showConfig, setShowConfig] = useState(false);

  const initialGameData = {
    teamA: { name: "Team A", score: 0, logo: "" },
    teamB: { name: "Team B", score: 0, logo: "" },
    league: { name: "Premier League", logo: "" },
    timer: 0,
    maxTime: 90 * 60,
    stoppageTime: 0,
    status: "FIRST_HALF",
    type: "knockout",
    extraTime: false,
    penalties: false,
    penaltyScores: { teamA: [], teamB: [] },
  };

  const {
    gameData,
    pauseTimer,
    resetMatch,
    startTimer,
    resume,
    changeScore,
    addTime,
    subtractTime,
    setGame,
    startFirstHalf,
    startSecondHalf,
    startExtraTimeFirstHalf,
    startExtraTimeSecondHalf,
    startPenalties,
  } = useGameTimer(initialGameData);

  useEffect(() => {
    send("update-scoreboard", gameData);
  }, [gameData]);

  const [timeoutDuration, setTimeoutDuration] = useState(60);
  const [timeoutTimer, setTimeoutTimer] = useState(0);
  const [timeoutRunning, setTimeoutRunning] = useState(false);
  const timeoutRef = useRef();

  const refreshScoreboards = async () =>
    setScoreboards(await invoke("get-scoreboards"));

  const showScoreboard = async () => {
    send("show-scoreboard", selectedDisplay);
    setTimeout(refreshScoreboards, 100);
  };

  const closeScoreboard = async (displayId) => {
    send("close-scoreboard", displayId);
    setTimeout(refreshScoreboards, 100);
  };

  useEffect(() => {
    refreshScoreboards();
    (async () => {
      const cfg = await invoke("get-config");
      setGame({
        teamA: {
          ...gameData.teamA,
          name: cfg.teamA.name,
          logo: cfg.teamA.logo,
        },
        teamB: {
          ...gameData.teamB,
          name: cfg.teamB.name,
          logo: cfg.teamB.logo,
        },
        type: cfg.type,
      });

      const allDisplays = await invoke("get-displays");
      setDisplays(allDisplays);
      if (allDisplays.length > 0) setSelectedDisplay(allDisplays[0].id);
    })();
  }, []);

  const gameActions = [
    {
      label: "Start First Half",
      color: "#28a745",
      onClick: startFirstHalf,
      statusRequired: ["FIRST_HALF"],
    },
    {
      label: "Start Second Half",
      color: "#007bff",
      onClick: startSecondHalf,
      statusRequired: ["HALFTIME"],
    },
    {
      label: "Start Extra Time - 1st Half",
      color: "#fd7e14",
      onClick: startExtraTimeFirstHalf,
      statusRequired: ["EXTRA_TIME_FIRST_PENDING"],
      condition: () => gameData.teamA.score === gameData.teamB.score,
    },
    {
      label: "Start Extra Time - 2nd Half",
      color: "#fd7e14",
      onClick: startExtraTimeSecondHalf,
      statusRequired: ["EXTRA_TIME_SECOND_PENDING"],
    },
    {
      label: "Start Penalties",
      color: "#dc3545",
      onClick: startPenalties,
      statusRequired: ["EXTRA_TIME_END"],
      condition: () => gameData.teamA.score === gameData.teamB.score,
    },
  ];

  useEffect(() => {
    if (timeoutRunning) {
      timeoutRef.current = setTimeout(() => {
        setTimeoutTimer((t) => {
          const next = t + 1;
          send("update-timeout", next);
          return next;
        });
      }, 1000);
    } else {
      clearTimeout(timeoutRef.current);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [timeoutRunning, timeoutTimer]);

  useEffect(() => {
    const triggerPhases = [
      "HALFTIME",
      "FULLTIME",
      "EXTRA_TIME_FIRST",
      "EXTRA_TIME_SECOND",
      "PENALTIES",
    ];
    if (triggerPhases.includes(gameData.status)) {
      setTimeoutTimer(0);
      setTimeoutRunning(true);
      send("update-timeout", 0);
    }
  }, [gameData.status]);

  const formatTimeout = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const buttonStyle = (background, large = false) => ({
    background,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: large ? "8px 16px" : "6px 12px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: large ? "1.1rem" : "1rem",
    transition: "background-color 0.3s",
    userSelect: "none",
  });

  return showConfig ? (
    <ConfigPage goBack={() => setShowConfig(false)} />
  ) : (
    <div
      style={{
        padding: 30,
        fontFamily: "Arial, sans-serif",
        maxWidth: 1000,
        margin: "auto",
        background: "#f8f9fa",
        borderRadius: 15,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 30 }}>
        Football Match Control Panel
      </h1>

      {/* Status & Timer Section */}
      <section style={containerStyle}>
        <h2 style={sectionTitleStyle}>
          Status: <span style={{ color: "#007bff" }}>{gameData.status}</span>
        </h2>
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>
          Match type: {gameData.type}
        </h3>

        {/* Stoppage Time Controls */}
        <div
          style={{
            background: "#e9ecef",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0 }}>Additional time</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="number"
              min={0}
              max={30}
              value={gameData.stoppageTime || 0}
              onChange={(e) => {
                const value = Math.max(0, Math.min(30, Number(e.target.value)));
                setGame({ stoppageTime: value });
              }}
              style={{ width: 60, fontSize: 18, padding: 4 }}
            />
            <span>minutes</span>
            <button
              onClick={() => setGame({ stoppageTime: 0 })}
              style={{
                padding: "4px 10px",
                marginLeft: 8,
                background: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontWeight: "bold",
                cursor: "pointer",
              }}
              title="Clear Stoppage Time"
            >
              Clear
            </button>
          </div>
          <div style={{ fontSize: "1.1rem", marginTop: 6, color: "#007bff" }}>
            Current: {gameData.stoppageTime || 0} min
          </div>
        </div>

        {/* Penalty Shootout Controls */}
        {gameData.status === "PENALTIES" && (
          <div
            style={{
              background: "#fff3cd",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ffeeba",
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0, color: "#dc3545" }}>Penalty Shootout</h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 40,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              {/* Team A Penalties */}
              <div style={{ textAlign: "center", minWidth: 200 }}>
                <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                  {gameData.teamA.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {(gameData.penaltyScores?.teamA || []).map((result, idx) => (
                    <PenaltyCircle
                      key={idx}
                      result={result}
                      onClick={() => {
                        const arr = [...gameData.penaltyScores.teamA];
                        arr[idx] = arr[idx] === "goal" ? "miss" : "goal";
                        setGame({
                          penaltyScores: {
                            ...gameData.penaltyScores,
                            teamA: arr,
                          },
                        });
                      }}
                    />
                  ))}
                </div>
                <div>
                  <button
                    onClick={() =>
                      setGame({
                        penaltyScores: {
                          ...gameData.penaltyScores,
                          teamA: [
                            ...(gameData.penaltyScores?.teamA || []),
                            "goal",
                          ],
                        },
                      })
                    }
                    style={buttonStyle("#28a745")}
                    title="Add Goal"
                  >
                    + Goal
                  </button>
                  <button
                    onClick={() =>
                      setGame({
                        penaltyScores: {
                          ...gameData.penaltyScores,
                          teamA: [
                            ...(gameData.penaltyScores?.teamA || []),
                            "miss",
                          ],
                        },
                      })
                    }
                    style={{ ...buttonStyle("#dc3545"), marginLeft: 8 }}
                    title="Add Miss"
                  >
                    + Miss
                  </button>
                  <button
                    onClick={() => {
                      const arr = (gameData.penaltyScores?.teamA || []).slice(
                        0,
                        -1
                      );
                      setGame({
                        penaltyScores: {
                          ...gameData.penaltyScores,
                          teamA: arr,
                        },
                      });
                    }}
                    style={{ ...buttonStyle("#6c757d"), marginLeft: 8 }}
                    title="Undo Last"
                  >
                    Undo
                  </button>
                </div>
              </div>

              {/* Team B Penalties */}
              <div style={{ textAlign: "center", minWidth: 200 }}>
                <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                  {gameData.teamB.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {(gameData.penaltyScores?.teamB || []).map((result, idx) => (
                    <PenaltyCircle
                      key={idx}
                      result={result}
                      onClick={() => {
                        const arr = [...gameData.penaltyScores.teamB];
                        arr[idx] = arr[idx] === "goal" ? "miss" : "goal";
                        setGame({
                          penaltyScores: {
                            ...gameData.penaltyScores,
                            teamB: arr,
                          },
                        });
                      }}
                    />
                  ))}
                </div>
                <div>
                  <button
                    onClick={() =>
                      setGame({
                        penaltyScores: {
                          ...gameData.penaltyScores,
                          teamB: [
                            ...(gameData.penaltyScores?.teamB || []),
                            "goal",
                          ],
                        },
                      })
                    }
                    style={buttonStyle("#28a745")}
                    title="Add Goal"
                  >
                    + Goal
                  </button>
                  <button
                    onClick={() =>
                      setGame({
                        penaltyScores: {
                          ...gameData.penaltyScores,
                          teamB: [
                            ...(gameData.penaltyScores?.teamB || []),
                            "miss",
                          ],
                        },
                      })
                    }
                    style={{ ...buttonStyle("#dc3545"), marginLeft: 8 }}
                    title="Add Miss"
                  >
                    + Miss
                  </button>
                  <button
                    onClick={() => {
                      const arr = (gameData.penaltyScores?.teamB || []).slice(
                        0,
                        -1
                      );
                      setGame({
                        penaltyScores: {
                          ...gameData.penaltyScores,
                          teamB: arr,
                        },
                      });
                    }}
                    style={{ ...buttonStyle("#6c757d"), marginLeft: 8 }}
                    title="Undo Last"
                  >
                    Undo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Timer integrated here */}
        <AdditionalTimer
          timeoutDuration={timeoutDuration}
          setTimeoutDuration={setTimeoutDuration}
          timeoutTimer={timeoutTimer}
          setTimeoutTimer={setTimeoutTimer}
          setTimeoutRunning={setTimeoutRunning}
          send={send}
          formatTimeout={formatTimeout}
          buttonStyle={buttonStyle}
        />
      </section>

      {/* Timer Component */}
      <Timer
        timer={gameData.timer}
        phase={gameData.status}
        pauseTimer={pauseTimer}
        resetMatch={resetMatch}
        addTime={addTime}
        subtractTime={subtractTime}
        startTimer={startTimer}
        resume={resume}
      />

      {/* Scores */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: 30,
        }}
      >
        {gameData.status !== "PENALTIES" && (
          <>
            <ScoreControl
              teamName={gameData.teamA.name}
              score={gameData.teamA.score}
              onChange={(delta) => changeScore("teamA", delta)}
            />
            <ScoreControl
              teamName={gameData.teamB.name}
              score={gameData.teamB.score}
              onChange={(delta) => changeScore("teamB", delta)}
            />
          </>
        )}
      </div>

      {/* Phase Controls */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 15,
          justifyItems: "center",
          marginBottom: 30,
        }}
      >
        {gameActions.map((action, index) => {
          const enabledStatus = action.statusRequired.includes(gameData.status);
          const enabledCondition = action.condition ? action.condition() : true;
          return (
            <button
              key={index}
              onClick={action.onClick}
              disabled={!enabledStatus || !enabledCondition}
              style={{
                background:
                  enabledStatus && enabledCondition ? action.color : "#adb5bd",
                color: "white",
                padding: "15px 25px",
                fontWeight: "bold",
                fontSize: "1.1rem",
                borderRadius: 8,
                width: "100%",
                cursor:
                  enabledStatus && enabledCondition ? "pointer" : "not-allowed",
                opacity: enabledStatus && enabledCondition ? 1 : 0.6,
                transition: "background-color 0.3s",
              }}
              title={
                !enabledStatus
                  ? `Allowed only in ${action.statusRequired.join(", ")}`
                  : ""
              }
            >
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Scoreboard Manager */}
      <ScoreboardManager
        scoreboards={scoreboards}
        displays={displays}
        selectedDisplay={selectedDisplay}
        setSelectedDisplay={setSelectedDisplay}
        showScoreboard={showScoreboard}
        closeScoreboard={closeScoreboard}
        refreshScoreboards={refreshScoreboards}
      />

      {/* Config Button */}
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <button
          onClick={() => setShowConfig(true)}
          style={{
            background: "#6c757d",
            color: "white",
            padding: "12px 25px",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#5a6268")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#6c757d")
          }
        >
          ⚙️ Open Config Editor
        </button>
      </div>
    </div>
  );
}

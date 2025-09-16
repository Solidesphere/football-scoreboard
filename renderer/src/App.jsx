import { useState, useEffect } from "react";
import { send, invoke } from "./ipc";

import Timer from "./components/Timer/Timer";
import ScoreControl from "./components/ScoreControl/ScoreControl";
import ScoreboardManager from "./components/ScoreboardManager/ScoreboardManager";
import useGameTimer from "./hooks/useGameTimer";

export default function App() {
  const [scoreboards, setScoreboards] = useState([]);
  const [displays, setDisplays] = useState([]);
  const [selectedDisplay, setSelectedDisplay] = useState(0);

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
  };

  const {
    gameData,
    pauseTimer,
    resetMatch,
    startTimer,
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

  return (
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
        ⚽ Football Match Control Panel
      </h1>

      {/* ---------------- Status & Timer ---------------- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <div>
          <h2>
            Status: <span style={{ color: "#007bff" }}>{gameData.status}</span>
          </h2>
          <h2>Match type: {gameData.type}</h2>
        </div>

        <Timer
          timer={gameData.timer}
          phase={gameData.status}
          pauseTimer={pauseTimer}
          resetMatch={resetMatch}
          addTime={addTime}
          subtractTime={subtractTime}
          startTimer={startTimer}
        />
      </div>

      {/* ---------------- Scores ---------------- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: 30,
        }}
      >
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
      </div>

      {/* ---------------- Phase Controls ---------------- */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        {gameData.status === "FIRST_HALF" && (
          <button
            onClick={startFirstHalf}
            style={{
              background: "#28a745",
              color: "white",
              padding: "15px 25px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Start First Half
          </button>
        )}

        {gameData.status === "HALFTIME" && (
          <button
            onClick={startSecondHalf}
            style={{
              background: "#007bff",
              color: "white",
              padding: "15px 25px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Start Second Half
          </button>
        )}

        {(gameData.status === "EXTRA_TIME_FIRST_PENDING"&& (gameData.teamA.score == gameData.teamB.score ))&& (
          <button
            onClick={startExtraTimeFirstHalf}
            style={{
              background: "#fd7e14",
              color: "white",
              padding: "15px 25px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Start Extra Time - 1st Half
          </button>
        )}

        {gameData.status === "EXTRA_TIME_SECOND_PENDING" && (
          <button
            onClick={startExtraTimeSecondHalf}
            style={{
              background: "#fd7e14",
              color: "white",
              padding: "15px 25px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Start Extra Time - 2nd Half
          </button>
        )}

        {(gameData.status === "EXTRA_TIME_END" && (gameData.teamA.score == gameData.teamB.score ) ) && (
          <button
            onClick={startPenalties}
            style={{
              background: "#dc3545",
              color: "white",
              padding: "15px 25px",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Start Penalties
          </button>
        )}
      </div>

      {/* ---------------- Scoreboard Manager ---------------- */}
      <ScoreboardManager
        scoreboards={scoreboards}
        displays={displays}
        selectedDisplay={selectedDisplay}
        setSelectedDisplay={setSelectedDisplay}
        showScoreboard={showScoreboard}
        closeScoreboard={closeScoreboard}
        refreshScoreboards={refreshScoreboards}
      />

      <div style={{ textAlign: "center", marginTop: 30 }}>
        <button
          onClick={() => send("show-config")}
          style={{
            background: "#6c757d",
            color: "white",
            padding: "12px 25px",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          ⚙️ Open Config Editor
        </button>
      </div>
    </div>
  );
}

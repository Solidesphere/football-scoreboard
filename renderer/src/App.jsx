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
          resume={resume}
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
      
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    justifyItems: "center",
    marginBottom: 30,
  }}
>
  {gameActions.map((action, index) => {
   

    return (
      <button
        key={index}
        onClick={action.onClick}
        
        style={{
          background: action.color,
          color: "white",
          padding: "15px 25px",
          fontWeight: "bold",
          fontSize: "1.1rem",
          borderRadius: 8,
          width: "100%", // button fills the grid cell
          
        }}
      >
        {action.label}
      </button>
    );
  })}
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

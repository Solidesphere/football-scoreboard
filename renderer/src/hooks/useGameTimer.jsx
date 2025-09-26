import { useState, useRef, useEffect } from "react";
import { send, invoke } from "../ipc";

export default function useGameTimer(initialData) {
  const [gameData, setGameData] = useState(initialData);
  const intervalRef = useRef(null);

  // ---------------- Load saved config ----------------
  useEffect(() => {
    (async () => {
      const cfg = await invoke("get-config");
      setGameData((prev) => ({
        ...prev,
        teamA: { ...prev.teamA, name: cfg.teamA.name, logo: cfg.teamA.logo },
        teamB: { ...prev.teamB, name: cfg.teamB.name, logo: cfg.teamB.logo },
        type: cfg.type,
      }));
    })();
  }, []);

  // ---------------- Scoreboard update ----------------
  const updateScoreboard = (data = gameData) => send("update-scoreboard", data);

  // ---------------- Timer ----------------
  const startTimer = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => tick(1), 1000);
  };

  const resume = () => {
    if (
      (gameData.status === "FIRST_HALF" && gameData.timer === 0 * 60) ||
      (gameData.status === "FIRST_HALF" && gameData.timer === 45 * 60) ||
      (gameData.status === "SECOND_HALF" && gameData.timer === 45 * 60) ||
      (gameData.status === "SECOND_HALF" && gameData.timer === 90 * 60) ||
      (gameData.status === "FULLTIME" && gameData.timer === 90 * 60) ||
      (gameData.status === "EXTRA_TIME_FIRST" && gameData.timer === 90 * 60) ||
      (gameData.status === "EXTRA_TIME_FIRST" && gameData.timer === 105 * 60) ||
      (gameData.status === "EXTRA_TIME_FIRST_PENDING" &&
        gameData.timer === 105 * 60) ||
      (gameData.status === "EXTRA_TIME_SECOND" && gameData.timer === 105 * 60)
    )
      return;

    // Prevent starting multiple intervals
    if (intervalRef.current) return;

    // Start the interval
    intervalRef.current = setInterval(() => tick(1), 1000);
  };

  const tick = (seconds) => {
    setGameData((prev) => {
      let newTimer = prev.timer + seconds;

      // Maximum allowed time per phase
      const maxAllowed = prev.status.startsWith("EXTRA_TIME")
        ? 120 * 60
        : prev.maxTime;

      if (newTimer >= maxAllowed) {
        newTimer = maxAllowed;
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      let newStatus = prev.status;

      // ---------------- Automatic phase transitions ----------------
      const timeThresholds = {
        FIRST_HALF: { max: 45 * 60, next: "HALFTIME" },
        SECOND_HALF: {
          max: 90 * 60,
          next: (prev) =>
            prev.type === "league"
              ? "FULLTIME"
              : prev.teamA.score === prev.teamB.score
              ? "EXTRA_TIME_FIRST_PENDING"
              : "FULLTIME",
        },
        EXTRA_TIME_FIRST: { max: 105 * 60, next: "EXTRA_TIME_SECOND_PENDING" },
        EXTRA_TIME_SECOND: { max: 120 * 60, next: "EXTRA_TIME_END" },
      };

      const threshold = timeThresholds[prev.status];

      if (threshold && newTimer >= threshold.max) {
        newStatus =
          typeof threshold.next === "function"
            ? threshold.next(prev)
            : threshold.next;
        newTimer = threshold.max;
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const newData = { ...prev, timer: newTimer, status: newStatus };
      updateScoreboard(newData);
      return newData;
    });
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  // ---------------- Reset match ----------------
  const resetMatch = async () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    const cfg = await invoke("get-config");

    setGameData((prev) => {
      const resetData = {
        ...prev,
        timer: 0,
        stoppageTime: 0,
        status: "FIRST_HALF",
        teamA: {
          ...prev.teamA,
          score: 0,
          name: cfg.teamA.name,
          logo: cfg.teamA.logo,
        },
        teamB: {
          ...prev.teamB,
          score: 0,
          name: cfg.teamB.name,
          logo: cfg.teamB.logo,
        },
        type: cfg.type,
        extraTime: false,
        penalties: false,
        penaltyScores: { teamA: [], teamB: [] },
      };
      updateScoreboard(resetData);
      return resetData;
    });
  };

  // ---------------- Score ----------------
  const changeScore = (team, delta) => {
    setGameData((prev) => {
      const newScore = Math.max((prev[team].score ?? 0) + delta, 0);
      const newData = { ...prev, [team]: { ...prev[team], score: newScore } };
      updateScoreboard(newData);
      return newData;
    });
  };

  // ---------------- Manual Time Adjust ----------------
  const addTime = (seconds) => tick(seconds);

  const subtractTime = (seconds) =>
    setGameData((prev) => {
      const newData = { ...prev, timer: Math.max(prev.timer - seconds, 0) };
      updateScoreboard(newData);
      return newData;
    });

  const displayTimer = () => {
    const m = Math.floor(gameData.timer / 60)
      .toString()
      .padStart(2, "0");
    const s = (gameData.timer % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ---------------- Helper: Start a phase ----------------
  const startPhase = (
    start,
    maxTime,
    status,
    extraTime = false,
    penalties = false
  ) => {
    setGameData((prev) => {
      const newData = {
        ...prev,
        timer: start,
        maxTime,
        status,
        extraTime,
        penalties,
      };
      updateScoreboard(newData);

      // Automatically start timer if not penalties
      if (!penalties) startTimer();

      return newData;
    });
  };

  // ---------------- Match Phases ----------------
  const startFirstHalf = () => startPhase(0, 45 * 60, "FIRST_HALF");
  const startSecondHalf = () => startPhase(45 * 60, 90 * 60, "SECOND_HALF");
  const startExtraTimeFirstHalf = () =>
    startPhase(90 * 60, 105 * 60, "EXTRA_TIME_FIRST", true);
  const startExtraTimeSecondHalf = () =>
    startPhase(105 * 60, 120 * 60, "EXTRA_TIME_SECOND", true);
  const startPenalties = () => startPhase(0, 0, "PENALTIES", false, true);

  // ---------------- Manual Game Update ----------------
  const setGame = (newData) => {
    setGameData((prev) => {
      // Special merge for penaltyScores arrays
      let merged = { ...prev, ...newData };
      if (newData.penaltyScores) {
        merged.penaltyScores = {
          teamA: Array.isArray(newData.penaltyScores.teamA)
            ? newData.penaltyScores.teamA
            : prev.penaltyScores.teamA,
          teamB: Array.isArray(newData.penaltyScores.teamB)
            ? newData.penaltyScores.teamB
            : prev.penaltyScores.teamB,
        };
      }
      updateScoreboard(merged);
      return merged;
    });
  };

  return {
    gameData,
    startTimer,
    pauseTimer,
    resetMatch,
    changeScore,
    displayTimer,
    addTime,
    subtractTime,
    setGame,
    startFirstHalf,
    startSecondHalf,
    startExtraTimeFirstHalf,
    startExtraTimeSecondHalf,
    startPenalties,
    resume,
  };
}

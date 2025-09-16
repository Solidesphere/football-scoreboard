import React from "react";

export default function Timer({
  timer,
  pauseTimer,
  resetMatch,
  addTime,
  subtractTime,
  phase,
  startTimer,
}) {
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeInSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case "FIRST_HALF":
        return "First Half";
      case "HALFTIME":
        return "Halftime";
      case "SECOND_HALF":
        return "Second Half";
      case "EXTRA_TIME_FIRST":
        return "Extra Time - First Half";
      case "EXTRA_TIME_SECOND":
        return "Extra Time - Second Half";
      case "EXTRA_TIME_END":
        return "Extra Time End";
      case "FULLTIME":
        return "Full Time";
      case "PENALTIES":
        return "Penalties";
      default:
        return "";
    }
  };

  return (
    <div
      style={{
        padding: 20,
        background: "#f8f9fa",
        borderRadius: 15,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        maxWidth: 400,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ fontSize: "2rem", marginBottom: 10 }}>
        {getPhaseLabel()} Timer: {formatTime(timer)}
      </h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
        <button
          onClick={startTimer}
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "1rem",
            background: "#07ff1cff",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Resume
        </button>
        <button
          onClick={pauseTimer}
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "1rem",
            background: "#ffc107",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Pause
        </button>
        <button
          onClick={resetMatch}
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "1rem",
            background: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>

      <h3 style={{ marginBottom: 10 }}>Adjust Timer</h3>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => addTime(60)}
          style={{
            flex: "1 1 45%",
            padding: "10px",
            fontSize: "1rem",
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          +1 min
        </button>
        <button
          onClick={() => subtractTime(60)}
          style={{
            flex: "1 1 45%",
            padding: "10px",
            fontSize: "1rem",
            background: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          -1 min
        </button>
        <button
          onClick={() => addTime(1)}
          style={{
            flex: "1 1 45%",
            padding: "10px",
            fontSize: "1rem",
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          +1 sec
        </button>
        <button
          onClick={() => subtractTime(1)}
          style={{
            flex: "1 1 45%",
            padding: "10px",
            fontSize: "1rem",
            background: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          -1 sec
        </button>
      </div>
    </div>
  );
}

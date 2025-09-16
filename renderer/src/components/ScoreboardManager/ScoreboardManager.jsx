import React from "react";

export default function ScoreboardManager({
  scoreboards,
  displays,
  selectedDisplay,
  setSelectedDisplay,
  showScoreboard,
  closeScoreboard,
  refreshScoreboards,
}) {
  return (
    <div
      style={{
        marginTop: 30,
        padding: 20,
        background: "#f8f9fa",
        borderRadius: 15,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        maxWidth: 600,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Display Selection */}
      <h3 style={{ marginBottom: 10, color: "#0d6efd" }}>
        Show Scoreboard on Display
      </h3>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <select
          value={selectedDisplay}
          onChange={(e) => setSelectedDisplay(Number(e.target.value))}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "1rem",
            borderRadius: 8,
            border: "1px solid #ced4da",
          }}
        >
          {displays.map((d) => (
            <option key={d.id} value={d.id}>
              Display {d.id} ({d.width}x{d.height})
            </option>
          ))}
        </select>
        <button
          onClick={showScoreboard}
          style={{
            padding: "8px 15px",
            fontWeight: "bold",
            background: "#0d6efd",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Show
        </button>
      </div>

      {/* Open Scoreboards List */}
      <h3 style={{ marginBottom: 10, color: "#0d6efd" }}>Open Scoreboards</h3>
      <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
        {scoreboards
          .filter((sb) => sb && sb.bounds)
          .map((sb) => (
            <li
              key={sb.displayId}
              style={{
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Display {sb.displayId}: {sb.bounds.width}x{sb.bounds.height}
              </span>
              <button
                onClick={() => closeScoreboard(sb.displayId)}
                style={{
                  padding: "5px 12px",
                  fontSize: "0.9rem",
                  background: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </li>
          ))}
      </ul>

      {/* Refresh Button */}
      <button
        onClick={refreshScoreboards}
        style={{
          padding: "8px 15px",
          fontWeight: "bold",
          background: "#6c757d",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Refresh List
      </button>
    </div>
  );
}

import React from "react";

export default function ScoreControl({ teamName, score, onChange }) {
  return (
    <div
      style={{
        marginBottom: 12,
        padding: 10,
        borderRadius: 8,
        background: "#f8f9fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: 320,
      }}
    >
      <h3 style={{ margin: 0, fontSize: "1.2rem", flex: 1 }}>
        {teamName}: <span style={{ fontWeight: "bold" }}>{score}</span>
      </h3>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onChange(1)}
          style={{
            padding: "6px 12px",
            fontSize: "1rem",
            fontWeight: "bold",
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            transition: "background 0.2s",
            marginLeft: 5,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#218838")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#28a745")}
        >
          +1
        </button>
        <button
          onClick={() => score > 0 && onChange(-1)}
          style={{
            padding: "6px 12px",
            fontSize: "1rem",
            fontWeight: "bold",
            background: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: score > 0 ? "pointer" : "not-allowed",
            opacity: score > 0 ? 1 : 0.6,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            score > 0 && (e.currentTarget.style.background = "#c82333")
          }
          onMouseLeave={(e) =>
            score > 0 && (e.currentTarget.style.background = "#dc3545")
          }
          disabled={score <= 0}
        >
          -1
        </button>
      </div>
    </div>
  );
}

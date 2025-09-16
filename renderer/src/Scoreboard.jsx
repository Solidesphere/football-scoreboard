import { useState, useEffect } from "react";
import { on, invoke } from "./ipc";

export default function Scoreboard() {
  const [data, setData] = useState({
    teamA: { name: "Team A", score: 0, logo: "" },
    teamB: { name: "Team B", score: 0, logo: "" },
    leagueLogo: "", // added league logo
    timer: 0,
    status: "FIRST_HALF",
    type: "league",
  });

  useEffect(() => {
    (async () => {
      const cfg = await invoke("get-config");
      setData((prev) => ({
        ...prev,
        type: cfg.type || prev.type,
        leagueLogo: cfg.leagueLogo || "",
        teamA: { ...prev.teamA, ...cfg.teamA, score: 0 },
        teamB: { ...prev.teamB, ...cfg.teamB, score: 0 },
        timer: 0,
        status: "FIRST_HALF",
      }));
    })();

    on("update-data", (newData) => {
      setData((prev) => ({
        ...prev,
        ...newData,
        teamA: {
          ...prev.teamA,
          ...newData.teamA,
          score: newData.teamA?.score ?? prev.teamA.score,
        },
        teamB: {
          ...prev.teamB,
          ...newData.teamB,
          score: newData.teamB?.score ?? prev.teamB.score,
        },
      }));
    });

    on("load-config", (cfg) => {
      setData((prev) => ({
        ...prev,
        type: cfg.type || prev.type,
        leagueLogo: cfg.leagueLogo || "",
        teamA: {
          ...prev.teamA,
          name: cfg.teamA.name,
          logo: cfg.teamA.logo,
          score: prev.teamA.score ?? 0,
        },
        teamB: {
          ...prev.teamB,
          name: cfg.teamB.name,
          logo: cfg.teamB.logo,
          score: prev.teamB.score ?? 0,
        },
      }));
    });
  }, []);

  const formatTimer = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div
      style={{
        fontFamily: "'Roboto', Arial, sans-serif",
        width: "100vw",
        height: "100vh",
        background: "#f8f9fa",
        color: "#222",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
    
    {/* League Logo */}
      {data.leagueLogo && (
        <div style={{ marginBottom: 20 }}>
          <img
            src={data.leagueLogo}
            alt="League Logo"
            style={{ height: 100, objectFit: "contain", marginTop:"15px"}}
          />
        </div>
      )}
      {/* Score & Timer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          width: "95%",
          maxWidth: "1600px",
          background: "#ffffff",
          borderRadius: "25px",
          padding: "60px",
          boxShadow: "0 0 50px rgba(0,0,0,0.2)",
        }}
      >
        
        {/* Team A */}
        <div style={{ textAlign: "center", flex: 1 }}>
          {data.teamA.logo && (
            <img
              src={data.teamA.logo}
              alt="logo"
              style={{ height: "200px", marginBottom: "20px" }}
            />
          )}
          <div
            style={{
              fontSize: "3rem",
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            {data.teamA.name}
          </div>
          <div
            style={{ fontSize: "7rem", fontWeight: "bold", color: "#198754" }}
          >
            {data.teamA.score}
          </div>
        </div>

        {/* Timer */}
        <div
          style={{
            fontSize: "5rem",
            fontWeight: "bold",
            margin: "0 60px",
            color: "#060505ff",
            textShadow: "2px 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          {formatTimer(data.timer)}
        </div>

        {/* Team B */}
        <div style={{ textAlign: "center", flex: 1 }}>
          {data.teamB.logo && (
            <img
              src={data.teamB.logo}
              alt="logo"
              style={{ height: "200px", marginBottom: "20px" }}
            />
          )}
          <div
            style={{
              fontSize: "3rem",
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            {data.teamB.name}
          </div>
          <div
            style={{ fontSize: "7rem", fontWeight: "bold", color: "#dc3545" }}
          >
            {data.teamB.score}
          </div>
        </div>
      </div>
    </div>
  );
}

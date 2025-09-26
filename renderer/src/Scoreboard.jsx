import { useState, useEffect } from "react";
import { on, invoke } from "./ipc";

export default function Scoreboard() {
  const [data, setData] = useState({
    teamA: { name: "Team A", score: 0, logo: "" },
    teamB: { name: "Team B", score: 0, logo: "" },
    leagueLogo: "", // added league logo
    timer: 0,
    status: "READY",
    type: "league",
    scoreboardStyle: {
      backgroundType: "color",
      backgroundColor: "#23272a",
      backgroundImage: "",
      textColor: "#fff",
      accentColor: "#5865f2",
      logoSizeA: 50,
      logoSizeB: 50,
    },
  });
  const [styleKey, setStyleKey] = useState(0);

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
        status: "READY",
        scoreboardStyle: cfg.scoreboardStyle || prev.scoreboardStyle,
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

    // Listen for live style updates from config page
    on("update-scoreboard-style", (newStyle) => {
      setData((prev) => ({
        ...prev,
        scoreboardStyle: { ...newStyle },
      }));
    });
  }, []);

  // Track scoreboardStyle changes and force rerender
  useEffect(() => {
    setStyleKey((k) => k + 1);
  }, [data.scoreboardStyle]);

  const formatTimer = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div
      key={styleKey}
      style={{
        fontFamily: "'Roboto', Arial, sans-serif",
        width: "100vw",
        height: "100vh",
        background:
          data.scoreboardStyle.backgroundType === "image" &&
          data.scoreboardStyle.backgroundImage
            ? `url(${data.scoreboardStyle.backgroundImage}) center/cover no-repeat`
            : data.scoreboardStyle.backgroundColor,
        color: data.scoreboardStyle.textColor,
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
            style={{ height: 100, objectFit: "contain", marginTop: "15px" }}
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
          background: data.scoreboardStyle.scoreAreaBgColor || "#ffffff",
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
              style={{
                height: data.scoreboardStyle.logoSizeA || 50,
                marginBottom: "20px",
              }}
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
            style={{
              fontSize: "7rem",
              fontWeight: "bold",
              color: data.scoreboardStyle.accentColor || "#198754",
            }}
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
              style={{
                height: data.scoreboardStyle.logoSizeB || 50,
                marginBottom: "20px",
              }}
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
            style={{
              fontSize: "7rem",
              fontWeight: "bold",
              color: data.scoreboardStyle.accentColor || "#dc3545",
            }}
          >
            {data.teamB.score}
          </div>
        </div>
      </div>
    </div>
  );
}

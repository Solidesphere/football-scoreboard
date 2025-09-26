import { useState, useEffect, useRef } from "react";
import { on, invoke } from "./ipc";

export default function Scoreboard() {
  const [data, setData] = useState({
    teamA: { name: "Team A", score: 0, logo: "" },
    teamB: { name: "Team B", score: 0, logo: "" },
    leagueLogo: "",
    timer: 0,
    status: "READY",
    type: "league",
    stoppageTime: 0,
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
  const [timeoutTimer, setTimeoutTimer] = useState(0);
  const timeoutRef = useRef();

  useEffect(() => {
    (async () => {
      const cfg = await invoke("get-config");
      setData((prev) => ({
        ...prev,
        type: cfg.type || prev.type,
        leagueLogo:
          cfg.league && cfg.league.logo
            ? cfg.league.logo
            : cfg.leagueLogo || "",
        teamA: { ...prev.teamA, ...cfg.teamA, score: 0 },
        teamB: { ...prev.teamB, ...cfg.teamB, score: 0 },
        timer: 0,
        status: "READY",
        scoreboardStyle: cfg.scoreboardStyle || prev.scoreboardStyle,
      }));
    })();

    if (window.electronAPI?.send) {
      window.electronAPI.send("get-timeout");
    }

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
        leagueLogo:
          cfg.league && cfg.league.logo
            ? cfg.league.logo
            : cfg.leagueLogo || "",
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

    on("update-scoreboard-style", (newStyle) => {
      setData((prev) => ({
        ...prev,
        scoreboardStyle: { ...newStyle },
      }));
    });

    on("update-timeout", (val) => {
      setTimeoutTimer(val);
    });
  }, []);

  useEffect(() => {
    setStyleKey((k) => k + 1);
  }, [data.scoreboardStyle]);

  const formatTimer = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const formatTimeout = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const stoppageTimesToShow = [2700, 5400, 6300, 7200]; // seconds (45, 90, 105, 120 minutes)

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
      {data.leagueLogo && (
        <div style={{ marginBottom: 20 }}>
          <img
            src={data.leagueLogo}
            alt="League Logo"
            style={{ height: 100, objectFit: "contain", marginTop: "15px" }}
          />
        </div>
      )}

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
          {data.status === "PENALTIES" ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                marginTop: 20,
              }}
            >
              {(data.penaltyScores?.teamA || []).map((result, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-block",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: result === "goal" ? "#28a745" : "#dc3545",
                    border: "2px solid #222",
                    margin: "0 4px",
                    boxShadow:
                      result === "goal"
                        ? "0 0 8px #28a74588"
                        : "0 0 8px #dc354588",
                  }}
                  title={result === "goal" ? "Goal" : "Miss"}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: "7rem",
                fontWeight: "bold",
                color: data.scoreboardStyle.accentColor || "#198754",
              }}
            >
              {data.teamA.score}
            </div>
          )}
        </div>

        {/* Timer and Timeout */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "0 60px",
          }}
        >
          <div
            style={{
              fontSize: "5rem",
              fontWeight: "bold",
              color: "#060505ff",
              textShadow: "2px 2px 6px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {formatTimer(data.timer)}
            {/* Show +stoppageTime only at 45:00, 90:00, 105:00, 120:00 if stoppageTime > 0 */}
            {stoppageTimesToShow.includes(data.timer) &&
              data.stoppageTime > 0 && (
                <span
                  style={{
                    fontSize: "2.5rem",
                    color: data.scoreboardStyle.accentColor || "#007bff",
                    marginLeft: 10,
                  }}
                >
                  {`+${data.stoppageTime}`}
                </span>
              )}
          </div>

          {stoppageTimesToShow.includes(data.timer) && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <span
                style={{
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  color: data.scoreboardStyle.accentColor || "#007bff",
                }}
              ></span>
              <span
                style={{
                  fontSize: "3.2rem",
                  fontWeight: "bold",
                  marginLeft: 10,
                }}
              >
                {formatTimeout(timeoutTimer)}
              </span>
            </div>
          )}
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
          {data.status === "PENALTIES" ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                marginTop: 20,
              }}
            >
              {(data.penaltyScores?.teamB || []).map((result, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-block",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: result === "goal" ? "#28a745" : "#dc3545",
                    border: "2px solid #222",
                    margin: "0 4px",
                    boxShadow:
                      result === "goal"
                        ? "0 0 8px #28a74588"
                        : "0 0 8px #dc354588",
                  }}
                  title={result === "goal" ? "Goal" : "Miss"}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: "7rem",
                fontWeight: "bold",
                color: data.scoreboardStyle.accentColor || "#dc3545",
              }}
            >
              {data.teamB.score}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

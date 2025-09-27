import { useState, useEffect } from "react";
import { send, invoke } from "./ipc";

const defaultConfig = {
  teamA: { name: "Team A", logo: "" },
  teamB: { name: "Team B", logo: "" },
  league: { name: "League Name", logo: "" },
  type: "league",
  scoreboardStyle: {
    backgroundType: "color", // "color" or "image"
    backgroundColor: "#23272a",
    backgroundImage: "",
    textColor: "#fff",
    accentColor: "#5865f2",
    logoSizeA: 50,
    logoSizeB: 50,
  },
};

export default function ConfigPage({ goBack }) {
  const [config, setConfig] = useState(defaultConfig);
  const [style, setStyleRaw] = useState(defaultConfig.scoreboardStyle);

  // Send live style updates to scoreboard
  const setStyle = (updater) => {
    setStyleRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      send("update-scoreboard-style", next);
      return next;
    });
  };

  // Load saved config
  useEffect(() => {
    (async () => {
      const savedConfig = await invoke("get-config");
      setConfig({ ...defaultConfig, ...savedConfig });
      setStyle(savedConfig.scoreboardStyle || defaultConfig.scoreboardStyle);
    })();
  }, []);

  const pickLogo = async (key) => {
    let fileUrl;
    if (key === "league") {
      fileUrl = await invoke("pick-league-logo"); // make sure this IPC exists
    } else {
      fileUrl = await invoke("pick-logo", key);
    }
    if (!fileUrl) return;
    setConfig((prev) => ({
      ...prev,
      [key]: { ...prev[key], logo: fileUrl },
    }));
  };

  const handleSave = async () => {
    send("save-config", { ...config, scoreboardStyle: style });
    const cfg = await invoke("get-config");
    setConfig({ ...defaultConfig, ...cfg });
    setStyle(cfg.scoreboardStyle || defaultConfig.scoreboardStyle);
    alert("✅ Config saved! All windows will now reload.");
    if (window.electronAPI && window.electronAPI.send) {
      window.electronAPI.send("reload-all-windows");
    } else if (window.ipcRenderer && window.ipcRenderer.send) {
      window.ipcRenderer.send("reload-all-windows");
    } else {
      window.location.reload();
    }
  };

  const inputStyle = {
    padding: "8px 12px",
    fontSize: "1rem",
    borderRadius: 6,
    border: "1px solid #ced4da",
    width: 250,
    marginRight: 10,
  };

  const buttonStyle = {
    padding: "8px 16px",
    fontSize: "1rem",
    fontWeight: "bold",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    background: "#0d6efd",
    color: "#fff",
  };

  return (
    <div
      style={{
        padding: 30,
        fontFamily: "Arial, sans-serif",
        maxWidth: 600,
        margin: "auto",
        background: "#f8f9fa",
        borderRadius: 15,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <h1 style={{ margin: 0 }}>⚙️ Config Editor</h1>
        {goBack && (
          <button
            style={{
              padding: "8px 16px",
              fontSize: "1rem",
              fontWeight: "bold",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: "#6c757d",
              color: "#fff",
              marginLeft: 10,
            }}
            onClick={goBack}
          >
            ← Go Back
          </button>
        )}
      </div>

      {/* League Logo */}
      <div style={{ marginBottom: 25 }}>
        <h3>League Logo</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            style={buttonStyle}
            onClick={async () => {
              const fileUrl = await invoke("pick-league-logo");
              if (fileUrl) {
                setConfig((prev) => ({
                  ...prev,
                  league: { ...prev.league, logo: fileUrl }, // update inside league object
                }));
              }
            }}
          >
            Pick League Logo
          </button>
          {config.league?.logo && (
            <img
              src={config.league.logo} // same CSS as team logos
              alt="League Logo"
              style={{ height: 50, borderRadius: 6 }}
            />
          )}
        </div>
      </div>
      {/* Team A */}
      <div style={{ marginBottom: 25 }}>
        <h3>Team A</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            value={config.teamA?.name || ""}
            onChange={(e) =>
              setConfig({
                ...config,
                teamA: { ...config.teamA, name: e.target.value },
              })
            }
            style={inputStyle}
          />
          <button style={buttonStyle} onClick={() => pickLogo("teamA")}>
            Pick Logo
          </button>
          {config.teamA?.logo && (
            <img
              src={config.teamA.logo}
              alt="Team A Logo"
              style={{ height: 50, borderRadius: 6 }}
            />
          )}
        </div>
      </div>

      {/* Team B */}
      <div style={{ marginBottom: 25 }}>
        <h3>Team B</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            value={config.teamB?.name || ""}
            onChange={(e) =>
              setConfig({
                ...config,
                teamB: { ...config.teamB, name: e.target.value },
              })
            }
            style={inputStyle}
          />
          <button style={buttonStyle} onClick={() => pickLogo("teamB")}>
            Pick Logo
          </button>
          {config.teamB?.logo && (
            <img
              src={config.teamB.logo}
              alt="Team B Logo"
              style={{ height: 50, borderRadius: 6 }}
            />
          )}
        </div>
      </div>

      {/* Match Type */}
      <div style={{ marginBottom: 30 }}>
        <h3>Match Type</h3>
        <select
          value={config.type || "league"}
          onChange={(e) => setConfig({ ...config, type: e.target.value })}
          style={{
            padding: "8px 12px",
            fontSize: "1rem",
            borderRadius: 6,
            border: "1px solid #ced4da",
          }}
        >
          <option value="league">League / Group Stage</option>
          <option value="knockout">Knockout</option>
        </select>
      </div>

      {/* Scoreboard Style Customization */}
      <div
        style={{
          marginBottom: 30,
          padding: 20,
          background: "#e9ecef",
          borderRadius: 10,
        }}
      >
        <h3>Scoreboard Style</h3>
        <div style={{ marginBottom: 15 }}>
          <label style={{ marginRight: 10 }}>
            Background Type:
            <select
              value={style.backgroundType}
              onChange={(e) =>
                setStyle((s) => ({ ...s, backgroundType: e.target.value }))
              }
              style={{ marginLeft: 10 }}
            >
              <option value="color">Color</option>
              <option value="image">Image</option>
            </select>
          </label>
        </div>
        {style.backgroundType === "color" ? (
          <div style={{ marginBottom: 15 }}>
            <label>
              Background Color:
              <input
                type="color"
                value={style.backgroundColor}
                onChange={(e) =>
                  setStyle((s) => ({ ...s, backgroundColor: e.target.value }))
                }
                style={{ marginLeft: 10 }}
              />
            </label>
          </div>
        ) : (
          <div style={{ marginBottom: 15 }}>
            <label>
              Background Image URL:
              <input
                type="text"
                value={style.backgroundImage}
                onChange={(e) =>
                  setStyle((s) => ({ ...s, backgroundImage: e.target.value }))
                }
                style={{ marginLeft: 10, width: 250 }}
                placeholder="file:// or http://..."
              />
            </label>
            <button
              type="button"
              style={{
                marginLeft: 10,
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: "#0d6efd",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={async () => {
                const fileUrl = await invoke("pick-logo", "background");
                if (fileUrl)
                  setStyle((s) => ({ ...s, backgroundImage: fileUrl }));
              }}
            >
              Pick Image File
            </button>
          </div>
        )}

        <div style={{ marginBottom: 15 }}>
          <label>
            Score & Timer Area Background Color:
            <input
              type="color"
              value={style.scoreAreaBgColor || "#ffffff"}
              onChange={(e) =>
                setStyle((s) => ({ ...s, scoreAreaBgColor: e.target.value }))
              }
              style={{ marginLeft: 10 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>
            Text Color:
            <input
              type="color"
              value={style.textColor}
              onChange={(e) =>
                setStyle((s) => ({ ...s, textColor: e.target.value }))
              }
              style={{ marginLeft: 10 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>
            Accent Color:
            <input
              type="color"
              value={style.accentColor}
              onChange={(e) =>
                setStyle((s) => ({ ...s, accentColor: e.target.value }))
              }
              style={{ marginLeft: 10 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>
            Team A Logo Size:
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginLeft: 10,
              }}
            >
              <button
                type="button"
                style={{
                  padding: "2px 8px",
                  fontSize: "1.2rem",
                  borderRadius: 4,
                  border: "1px solid #ced4da",
                  background: "#fff",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setStyle((s) => ({
                    ...s,
                    logoSizeA: Math.max(20, s.logoSizeA - 5),
                  }))
                }
              >
                -
              </button>
              <input
                type="number"
                min={20}
                max={200}
                value={style.logoSizeA}
                onChange={(e) =>
                  setStyle((s) => ({ ...s, logoSizeA: Number(e.target.value) }))
                }
                style={{ width: 60, textAlign: "center", margin: "0 5px" }}
              />
              <button
                type="button"
                style={{
                  padding: "2px 8px",
                  fontSize: "1.2rem",
                  borderRadius: 4,
                  border: "1px solid #ced4da",
                  background: "#fff",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setStyle((s) => ({
                    ...s,
                    logoSizeA: Math.min(200, s.logoSizeA + 5),
                  }))
                }
              >
                +
              </button>
              <span style={{ marginLeft: 8 }}>px</span>
            </div>
          </label>
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>
            Team B Logo Size:
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginLeft: 10,
              }}
            >
              <button
                type="button"
                style={{
                  padding: "2px 8px",
                  fontSize: "1.2rem",
                  borderRadius: 4,
                  border: "1px solid #ced4da",
                  background: "#fff",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setStyle((s) => ({
                    ...s,
                    logoSizeB: Math.max(20, s.logoSizeB - 5),
                  }))
                }
              >
                -
              </button>
              <input
                type="number"
                min={20}
                max={200}
                value={style.logoSizeB}
                onChange={(e) =>
                  setStyle((s) => ({ ...s, logoSizeB: Number(e.target.value) }))
                }
                style={{ width: 60, textAlign: "center", margin: "0 5px" }}
              />
              <button
                type="button"
                style={{
                  padding: "2px 8px",
                  fontSize: "1.2rem",
                  borderRadius: 4,
                  border: "1px solid #ced4da",
                  background: "#fff",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setStyle((s) => ({
                    ...s,
                    logoSizeB: Math.min(200, s.logoSizeB + 5),
                  }))
                }
              >
                +
              </button>
              <span style={{ marginLeft: 8 }}>px</span>
            </div>
          </label>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <button style={{ ...buttonStyle, width: "150px" }} onClick={handleSave}>
          💾 Save Config
        </button>
      </div>
    </div>
  );
}

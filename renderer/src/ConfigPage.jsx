import { useState, useEffect } from "react";
import { send, invoke } from "./ipc";

const defaultConfig = {
  teamA: { name: "Team A", logo: "" },
  teamB: { name: "Team B", logo: "" },
  league: { name: "League Name", logo: "" },
  type: "league",
};

export default function ConfigPage() {
  const [config, setConfig] = useState(defaultConfig);

  // Load saved config
  useEffect(() => {
    (async () => {
      const savedConfig = await invoke("get-config");
      setConfig({ ...defaultConfig, ...savedConfig });
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
    send("save-config", config);
    const cfg = await invoke("get-config");
    setConfig({ ...defaultConfig, ...cfg });
    alert("✅ Config saved!");
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
      <h1 style={{ textAlign: "center", marginBottom: 30 }}>⚙️ Config Editor</h1>

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

      <div style={{ textAlign: "center" }}>
        <button style={{ ...buttonStyle, width: "150px" }} onClick={handleSave}>
          💾 Save Config
        </button>
      </div>
    </div>
  );
}

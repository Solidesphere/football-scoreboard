import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import Scoreboard from "./Scoreboard";
import ConfigPage from "./ConfigPage";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/scoreboard" element={<Scoreboard />} />
      <Route path="/config" element={<ConfigPage />} />
    </Routes>
  </HashRouter>
);

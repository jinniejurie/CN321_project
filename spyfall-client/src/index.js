import React from "react";
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SocketProvider } from "./components/SocketContext";
import Home from "./components/Home";
import Tutorial from "./components/Tutorial";
import Lobby from "./components/Lobby";
import Game from "./components/Game";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Router>
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </SocketProvider>
  </Router>
);
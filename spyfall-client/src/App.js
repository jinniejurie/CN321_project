import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SocketProvider } from "./components/SocketContext";
import Home from "./components/Home";
import Tutorial from "./components/Tutorial";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import "./App.css";

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;

import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SocketProvider } from "./SocketContext";
import Home from "./Home";
import Tutorial from "./Tutorial";
import Lobby from "./Lobby";
import Game from "./Game";
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

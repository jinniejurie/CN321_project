// LobbyUI.jsx
import React from "react";
import "./Lobby.css";

const LobbyUI = ({ name, setName, joinGame, joined, players }) => {
  return (
    <div className="lobby-container">
      <h2>Lobby</h2>
      <input
        type="text"
        className="lobby-input"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={joined}
      />
      <button className="lobby-button" onClick={joinGame} disabled={joined}>
        Join Game
      </button>
      <h3>Players:</h3>
      <ul className="lobby-players">
        {players.map((player, index) => (
          <li key={index}>{player.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default LobbyUI;
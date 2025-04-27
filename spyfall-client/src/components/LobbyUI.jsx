import React from "react";
import "../styles/Lobby.css";
 
const LobbyUI = ({ name, setName, joinGame, joined, players, playerCount }) => {
  return (
    <div className="lobby-container">
    {/* ส่วนที่ 1: หัวข้อ Player */}
    <div className="lobby-header">
      <h1>Player {playerCount}</h1>
    </div>
 
      {/* ส่วนที่ 2: ฟอร์มกรอกชื่อและปุ่ม Join */}
      <div className="lobby-form">
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
      </div>
 
      {/* ส่วนที่ 3: รายชื่อผู้เล่น */}
      <div className="lobby-players-container">
        <h3>Players:</h3>
        <ul className="lobby-players">
          {players.map((player, index) => (
            <li key={index} className="lobby-player">{player.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
 
export default LobbyUI;
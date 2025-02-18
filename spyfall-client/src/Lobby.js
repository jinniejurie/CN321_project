import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

const Lobby = () => {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    socket.on("updatePlayers", (playerList) => {
      setPlayers(playerList);
      if (playerList.length === 4) {
        navigate("/game");
      }
    });

    return () => {
      socket.off("updatePlayers");
    };
  }, [navigate]);

  const joinGame = () => {
    if (name.trim() && !joined) {
      socket.emit("joinGame", name);
      setJoined(true);
    }
  };

  return (
    <div>
      <h2>Lobby</h2>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={joined}
      />
      <button onClick={joinGame} disabled={joined}>
        Join Game
      </button>
      <h3>Players:</h3>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
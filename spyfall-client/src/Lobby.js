// Lobby.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import LobbyUI from "./LobbyUI";
 
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
    <div className="lobby-page"> {/* เพิ่ม class นี้เพื่อใช้แค่ในหน้า Lobby */}
      <LobbyUI
        name={name}
        setName={setName}
        joinGame={joinGame}
        joined={joined}
        players={players}
        playerCount={`${players.length}/4`}
      />
    </div>
  );
};
 
export default Lobby;
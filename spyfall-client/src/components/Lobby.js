import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "./SocketContext";
import LobbyUI from "./LobbyUI";

const Lobby = () => {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState([]);
  const [joined, setJoined] = useState(false);
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUpdatePlayers = (playerList) => {
      setPlayers(playerList);
      if (playerList.length >= 4) {
        navigate("/game");
      }
    };

    socket.on("updatePlayers", handleUpdatePlayers);

    return () => {
      socket.off("updatePlayers", handleUpdatePlayers);
    };
  }, [socket, navigate]);

  const joinGame = () => {
    if (name.trim() && !joined && socket && isConnected) {
      console.log("Storing player name:", name);
      localStorage.setItem("playerName", name);
      
      socket.emit("joinGame", name);
      setJoined(true);
    }
  };

  return (
    <div className="lobby-page">
      <LobbyUI
        name={name}
        setName={setName}
        joinGame={joinGame}
        joined={joined}
        players={players}
        playerCount={`${players.length}/4`}
        isConnected={isConnected}
      />
    </div>
  );
};

export default Lobby;
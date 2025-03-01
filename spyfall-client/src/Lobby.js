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
    // Make sure we have a socket before setting up listeners
    if (!socket) return;

    // Handle player list updates
    const handleUpdatePlayers = (playerList) => {
      setPlayers(playerList);
      // Automatically navigate to the game when we have 4 players
      if (playerList.length >= 4) {
        navigate("/game");
      }
    };

    // Set up listeners
    socket.on("updatePlayers", handleUpdatePlayers);

    // Clean up listeners when component unmounts
    return () => {
      socket.off("updatePlayers", handleUpdatePlayers);
    };
  }, [socket, navigate]);

  const joinGame = () => {
    if (name.trim() && !joined && socket && isConnected) {
      // Store the name in localStorage for persistence
      console.log("Storing player name:", name);
      localStorage.setItem("playerName", name);
      
      // Emit the joinGame event
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
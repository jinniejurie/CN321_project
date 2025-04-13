import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "./SocketContext";
import GameUI from "./GameUI";

const Game = () => {
  const { socket, isConnected } = useSocket();
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [allLocations, setAllLocations] = useState([]);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(300);
  const [playerName, setPlayerName] = useState("");

  // Get the player name from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem("playerName");
    if (storedName) {
      setPlayerName(storedName);
    }
  }, []);

  // Set up game-specific socket listeners
  useEffect(() => {
    if (!socket) return;
    
    // Re-join game if we have a name (handle page refreshes)
    if (playerName && isConnected) {
      socket.emit("joinGame", playerName);
    }

    const onUpdatePlayers = (updatedPlayers) => {
      setPlayers(updatedPlayers);
    };

    const onGameStarted = (data) => {
      console.log("Game Started! Role:", data.role, "Location:", data.location);
      setRole(data.role);
      setLocation(data.location);
      if (data.allLocations) {
        setAllLocations(data.allLocations);
      }
    };

    const onReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onUpdateTimer = (time) => {
      setTimer(time);
    };

    const onGameOver = ({ result }) => {
      alert(result);
    };

    // Register event listeners
    socket.on("updatePlayers", onUpdatePlayers);
    socket.on("gameStarted", onGameStarted);
    socket.on("receiveMessage", onReceiveMessage);
    socket.on("updateTimer", onUpdateTimer);
    socket.on("gameOver", onGameOver);

    // Clean up listeners when component unmounts
    return () => {
      socket.off("updatePlayers", onUpdatePlayers);
      socket.off("gameStarted", onGameStarted);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("updateTimer", onUpdateTimer);
      socket.off("gameOver", onGameOver);
    };
  }, [socket, playerName, isConnected]);

  const sendMessage = () => {
    if (message.trim() && socket && isConnected) {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  // Format timer for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <h2>Spyfall Game</h2>
        <div className="player-list">
          Players: {players.map(p => p.name).join(", ")}
        </div>
        <div className="game-timer">
          Time: {formatTime(timer)}
        </div>
        {!isConnected && (
          <div className="connection-status">
            Disconnected from server. Trying to reconnect...
          </div>
        )}
      </div>
      
      <GameUI
        role={role}
        location={location}
        options={allLocations}
        messages={messages}
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
        playerName={playerName}
      />
    </div>
  );
};

export default Game;

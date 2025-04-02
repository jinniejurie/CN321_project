import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "./SocketContext";
import LobbyUI from "./LobbyUI"; // ใช้ LobbyUI เดิม แต่จะแสดงข้อมูลห้องแทน

const Room = () => {
  const { roomCode } = useParams(); // รับรหัสห้องจาก URL
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [canStartGame, setCanStartGame] = useState(false);
  const [settings, setSettings] = useState({
    gameTimeInMinutes: 5,
    spiesCount: 1,
    maxPlayers: 8
  });
  const [errorMessage, setErrorMessage] = useState("");
  
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // ตรวจสอบว่าผู้เล่นได้เข้าร่วมห้องแล้วหรือยัง
    const playerName = localStorage.getItem("playerName");
    const storedIsHost = localStorage.getItem("isHost") === "true";
    
    setIsHost(storedIsHost);
    
    // พยายามเข้าร่วมห้องที่ระบุในพารามิเตอร์
    socket.emit("joinRoom", { roomCode, playerName });

    // Handle player list updates
    const handleUpdatePlayers = (data) => {
      console.log("Players updated:", data);
      setPlayers(data.players);
    };

    // Handle settings updates
    const handleSettingsUpdated = (updatedSettings) => {
      console.log("Settings updated:", updatedSettings);
      setSettings(updatedSettings);
    };

    // Handle ability to start game
    const handleCanStartGame = (canStart) => {
      setCanStartGame(canStart);
    };

    // Handle game starting
    const handleGameStarted = () => {
      navigate("/game");
    };

    // Handle error messages
    const handleErrorMessage = (data) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(""), 5000);
    };

    // Register event listeners
    socket.on("updatePlayers", handleUpdatePlayers);
    socket.on("settingsUpdated", handleSettingsUpdated);
    socket.on("canStartGame", handleCanStartGame);
    socket.on("gameStarted", handleGameStarted);
    socket.on("errorMessage", handleErrorMessage);

    // Clean up event listeners
    return () => {
      socket.off("updatePlayers", handleUpdatePlayers);
      socket.off("settingsUpdated", handleSettingsUpdated);
      socket.off("canStartGame", handleCanStartGame);
      socket.off("gameStarted", handleGameStarted);
      socket.off("errorMessage", handleErrorMessage);
    };
  }, [socket, roomCode, navigate, isConnected]);

  // Update room settings (host only)
  const handleUpdateSettings = (newSettings) => {
    if (socket && isConnected && isHost) {
      socket.emit("updateSettings", { roomCode, settings: newSettings });
    }
  };

  // Start the game (host only)
  const handleStartGame = () => {
    if (socket && isConnected && isHost && canStartGame) {
      socket.emit("startGame", { roomCode });
    }
  };

  // แสดงหน้าห้องพร้อมกับส่งข้อมูลไปที่ LobbyUI
  return (
    <div className="lobby-page">
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      <LobbyUI
        onStartGame={handleStartGame}
        onUpdateSettings={handleUpdateSettings}
        players={players}
        isHost={isHost}
        roomCode={roomCode}
        settings={settings}
        canStartGame={canStartGame}
      />
    </div>
  );
};

export default Room;
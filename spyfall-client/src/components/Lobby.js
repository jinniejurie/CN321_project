import React, { useState, useEffect } from "react";
import { useSocket } from "./SocketContext";
import LobbyUI from "./LobbyUI";

const Lobby = () => {
  // สถานะห้องและผู้เล่น
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [canStartGame, setCanStartGame] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [joinMode, setJoinMode] = useState(false);
  
  // สถานะการตั้งค่าเกม
  const [settings, setSettings] = useState({
    gameTimeInMinutes: 5,
    spiesCount: 1,
    maxPlayers: 8
  });
  
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // รับข้อมูลผู้เล่นในห้อง
    const handleUpdatePlayers = (data) => {
      console.log("Players updated:", data);
      setPlayers(data.players);
      // ตรวจสอบว่ามีผู้เล่นพอจะเริ่มเกมได้หรือไม่
      setCanStartGame(data.players.length >= 4);
    };

    // รับผลลัพธ์การสร้างห้อง
    const handleRoomCreated = (data) => {
      console.log("Room created:", data);
      setRoomCode(data.roomCode);
      setRoomCreated(true);
      setIsHost(true);
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("roomCode", data.roomCode);
    };

    // รับผลลัพธ์การเข้าร่วมห้อง
    const handleRoomJoined = (data) => {
      console.log("Room joined:", data);
      setRoomCode(data.roomCode);
      setRoomCreated(true);
      setIsHost(data.isHost);
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("roomCode", data.roomCode);
    };

    // รับการอัปเดตการตั้งค่า
    const handleSettingsUpdated = (updatedSettings) => {
      console.log("Settings updated:", updatedSettings);
      setSettings(updatedSettings);
    };

    // จัดการข้อผิดพลาด
    const handleError = (data) => {
      console.error("Error:", data.message);
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(""), 5000);
    };

    // ลงทะเบียนตัวรับฟังเหตุการณ์
    socket.on("updatePlayers", handleUpdatePlayers);
    socket.on("roomCreated", handleRoomCreated);
    socket.on("roomJoined", handleRoomJoined);
    socket.on("settingsUpdated", handleSettingsUpdated);
    socket.on("errorMessage", handleError);
    socket.on("gameStarted", () => {
      window.location.href = '/game';
    });

    // ทำความสะอาดเมื่อคอมโพเนนต์ถูกยกเลิก
    return () => {
      socket.off("updatePlayers", handleUpdatePlayers);
      socket.off("roomCreated", handleRoomCreated);
      socket.off("roomJoined", handleRoomJoined);
      socket.off("settingsUpdated", handleSettingsUpdated);
      socket.off("errorMessage", handleError);
      socket.off("gameStarted");
    };
  }, [socket, playerName]);

  // สร้างห้องใหม่
  const handleCreateRoom = (name) => {
    console.log("Creating room with name:", name);
    if (!socket || !isConnected) {
      setErrorMessage("Cannot connect to server. Please try again.");
      return;
    }
    
    setPlayerName(name);
    socket.emit("createRoom", { playerName: name });
  };

  // เข้าร่วมห้องที่มีอยู่
  const handleJoinRoom = (code, name) => {
    console.log("Joining room:", code, "with name:", name);
    if (!socket || !isConnected) {
      setErrorMessage("Cannot connect to server. Please try again.");
      return;
    }
    
    setPlayerName(name);
    socket.emit("joinRoom", { roomCode: code, playerName: name });
  };

  // อัปเดตการตั้งค่าห้อง (สำหรับโฮสต์เท่านั้น)
  const handleUpdateSettings = (newSettings) => {
    if (!socket || !isConnected || !isHost) return;
    
    socket.emit("updateSettings", { roomCode, settings: newSettings });
  };

  // เริ่มเกม (สำหรับโฮสต์เท่านั้น)
  const handleStartGame = () => {
    if (!socket || !isConnected || !isHost || !canStartGame) return;
    
    socket.emit("startGame", { roomCode });
  };

  // เปลี่ยนโหมดจากสร้างห้องเป็นเข้าร่วมห้อง
  const switchToJoinMode = () => {
    setJoinMode(true);
  };

  // เปลี่ยนโหมดจากเข้าร่วมห้องเป็นสร้างห้อง
  const switchToCreateMode = () => {
    setJoinMode(false);
  };

  // ออกจากห้อง
  const leaveRoom = () => {
    if (socket) {
      socket.emit("leaveRoom", { roomCode });
    }
    setRoomCreated(false);
    setRoomCode("");
    setPlayers([]);
    setIsHost(false);
  };

  return (
    <div className="lobby-page">
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}
      <LobbyUI
        // สถานะห้อง
        roomCreated={roomCreated}
        roomCode={roomCode}
        players={players}
        isHost={isHost}
        canStartGame={canStartGame}
        settings={settings}
        
        // โหมดการทำงาน
        joinMode={joinMode}
        switchToJoinMode={switchToJoinMode}
        switchToCreateMode={switchToCreateMode}
        
        // ฟังก์ชันต่างๆ
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onUpdateSettings={handleUpdateSettings}
        onStartGame={handleStartGame}
        onLeaveRoom={leaveRoom}
      />
    </div>
  );
};

export default Lobby;
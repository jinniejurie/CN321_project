import React, { useState } from "react";
import "../styles/Lobby.css";

const LobbyUI = ({ 
  // สถานะห้อง
  roomCreated,
  roomCode,
  players = [],
  isHost,
  canStartGame,
  settings = {},
  
  // โหมดการทำงาน
  joinMode,
  switchToJoinMode,
  switchToCreateMode,
  
  // ฟังก์ชันต่างๆ
  onCreateRoom,
  onJoinRoom,
  onUpdateSettings,
  onStartGame,
  onLeaveRoom
}) => {
  // สถานะภายในฟอร์ม
  const [playerName, setPlayerName] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  
  // สถานะการตั้งค่าเกม
  const [gameMinutes, setGameMinutes] = useState(settings.gameTimeInMinutes || 5);
  const [spiesCount, setSpiesCount] = useState(settings.spiesCount || 1);
  const [maxPlayers, setMaxPlayers] = useState(settings.maxPlayers || 8);

  useEffect(() => {
    setGameMinutes(settings.gameTimeInMinutes || 5);
    setSpiesCount(settings.spiesCount || 1);
    setMaxPlayers(settings.maxPlayers || 8);
  }, [settings]);

  // ฟังก์ชันจัดการการส่งฟอร์มสร้างห้อง
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateRoom(playerName.trim());
    }
  };

  // ฟังก์ชันจัดการการส่งฟอร์มเข้าร่วมห้อง
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim() && joinRoomCode.trim()) {
      onJoinRoom(joinRoomCode.trim(), playerName.trim());
    }
  };

  // ฟังก์ชันอัปเดตการตั้งค่า
  const handleSettingsUpdate = () => {
    onUpdateSettings({
      gameTimeInMinutes: gameMinutes,
      spiesCount: spiesCount,
      maxPlayers: maxPlayers
    });
  };

  // ฟังก์ชันคัดลอกรหัสห้อง
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      alert("Room code copied to clipboard!");
    }).catch(err => {
      console.error("Could not copy room code:", err);
    });
  };

  // ถ้าสร้างห้องแล้ว แสดงหน้าห้อง
  if (roomCreated) {
    return (
      <div className="lobby-container">
        <div className="lobby-header">
          <h1>Spyfall Game</h1>
          <div className="room-code-container">
            <p>Room Code: <span className="room-code">{roomCode}</span></p>
            <button className="copy-button" onClick={copyRoomCode}>Copy Code</button>
          </div>
        </div>

        <div className="lobby-content">
          <div className="lobby-players-container">
            <h2>Players ({players.length}/{maxPlayers})</h2>
            <ul className="lobby-players">
              {players.map((player, index) => (
                <li key={index} className={`lobby-player ${player.isHost ? 'host' : ''}`}>
                  {player.name} {player.isHost ? "(Host)" : ""}
                </li>
              ))}
            </ul>
          </div>

          {isHost && (
            <div className="lobby-settings">
              <h2>Game Settings</h2>
              
              <div className="setting-group">
                <label>Game Time: {gameMinutes} minutes</label>
                <input 
                  type="range" 
                  min="3" 
                  max="10" 
                  value={gameMinutes}
                  onChange={(e) => setGameMinutes(parseInt(e.target.value))}
                />
              </div>
              
              <div className="setting-group">
                <label>Number of Spies: {spiesCount}</label>
                <input 
                  type="range" 
                  min="1" 
                  max={Math.min(3, Math.floor(players.length / 4) || 1)} 
                  value={spiesCount}
                  onChange={(e) => setSpiesCount(parseInt(e.target.value))}
                />
              </div>
              
              <div className="setting-group">
                <label>Max Players: {maxPlayers}</label>
                <input 
                  type="range" 
                  min="4" 
                  max="12" 
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                />
              </div>
              
              <button 
                className="update-settings-button"
                onClick={handleSettingsUpdate}
              >
                Update Settings
              </button>
              
              <button 
                className={`start-game-button ${!canStartGame ? 'disabled' : ''}`}
                onClick={onStartGame}
                disabled={!canStartGame}
              >
                Start Game
              </button>
              
              {!canStartGame && (
                <p className="min-players-note">Need at least 4 players to start</p>
              )}
            </div>
          )}
          
          {!isHost && (
            <div className="waiting-for-host">
              <h2>Waiting for host to start the game...</h2>
              {players.length < 4 && (
                <p className="min-players-note">Need at least 4 players to start</p>
              )}
            </div>
          )}
        </div>
        
        <button className="leave-room-button" onClick={onLeaveRoom}>
          Leave Room
        </button>
      </div>
    );
  }

  // ถ้ายังไม่ได้สร้างห้อง แสดงหน้าสร้าง/เข้าร่วมห้อง
  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>Spyfall Game</h1>
      </div>
      
      <div className="lobby-tabs">
        <button 
          className={`lobby-tab ${!joinMode ? 'active' : ''}`}
          onClick={switchToCreateMode}
        >
          Create Room
        </button>
        <button 
          className={`lobby-tab ${joinMode ? 'active' : ''}`}
          onClick={switchToJoinMode}
        >
          Join Room
        </button>
      </div>
      
      {!joinMode ? (
        // ฟอร์มสร้างห้อง
        <form className="lobby-form" onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label htmlFor="create-name">Your Name:</label>
            <input
              id="create-name"
              type="text"
              className="lobby-input"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="lobby-button"
            disabled={!playerName.trim()}
          >
            Create New Room
          </button>
        </form>
      ) : (
        // ฟอร์มเข้าร่วมห้อง
        <form className="lobby-form" onSubmit={handleJoinSubmit}>
          <div className="form-group">
            <label htmlFor="join-name">Your Name:</label>
            <input
              id="join-name"
              type="text"
              className="lobby-input"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="room-code">Room Code:</label>
            <input
              id="room-code"
              type="text"
              className="lobby-input"
              placeholder="Enter room code"
              value={joinRoomCode}
              onChange={(e) => setJoinRoomCode(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="lobby-button"
            disabled={!playerName.trim() || !joinRoomCode.trim()}
          >
            Join Room
          </button>
        </form>
      )}
    </div>
  );
};

export default LobbyUI;
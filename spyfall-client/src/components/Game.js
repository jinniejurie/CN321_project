import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "./SocketContext";
import GameUI from "./GameUI";
import VotingUI from "./VotingUI";
import GameResultUI from "./GameResultUI";

const Game = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [allLocations, setAllLocations] = useState([]);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(300);
  const [gamePhase, setGamePhase] = useState("playing"); // playing, voting, result
  const [votedPlayers, setVotedPlayers] = useState([]);
  const [gameResult, setGameResult] = useState(null);
  const [disconnected, setDisconnected] = useState(false);

  // แสดงค่าสถานะเพื่อดีบัก
  useEffect(() => {
    console.log("Current game state:", {
      role,
      location,
      timer,
      gamePhase,
      players: players.length
    });
  }, [role, location, timer, gamePhase, players]);

  // ตัวจับเวลาในฝั่ง client สำรอง
  useEffect(() => {
    if (gamePhase === "playing" && timer > 0) {
      const intervalId = setInterval(() => {
        setTimer(prevTimer => {
          const newTime = prevTimer - 1;
          // เมื่อเวลาเป็น 0 ให้เปลี่ยนเป็นหน้าโหวต
          if (newTime <= 0) {
            console.log("CLIENT TIMER REACHED ZERO - SWITCHING TO VOTING");
            clearInterval(intervalId);
            setGamePhase("voting");
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [gamePhase, timer]);

  // Get information from localStorage
  useEffect(() => {
    const storedRoomCode = localStorage.getItem("roomCode");
    const storedPlayerName = localStorage.getItem("playerName");

    console.log("Retrieved from localStorage:", {
      roomCode: storedRoomCode,
      playerName: storedPlayerName
    });

    if (storedRoomCode) {
      setRoomCode(storedRoomCode);
    } else {
      // If no room code, return to lobby
      navigate("/lobby");
    }

    if (storedPlayerName) {
      setPlayerName(storedPlayerName);
    }
  }, [navigate]);

  // Set up game-specific socket listeners
  useEffect(() => {
    if (!socket) {
      console.error("Socket is not initialized!");
      return;
    }

    if (!isConnected) {
      console.warn("Socket is not connected!");
    } else {
      console.log("Socket connected:", socket.id);
    }

    if (roomCode && playerName && isConnected) {
      console.log(`Attempting to (re)join room ${roomCode} as ${playerName}`);
      socket.emit("joinRoom", { roomCode, playerName });
    }

    // Handle updated player list
    const handleUpdatePlayers = (data) => {
      console.log("Players updated:", data);
      if (data && data.players) {
        setPlayers(data.players);
      }
    };

    // Handle game initialization
    const handleGameStarted = (data) => {
      console.log("Game Started event received:", data);
      if (data) {
        setRole(data.role || "");
        setLocation(data.location || "");
        if (data.allLocations && data.allLocations.length > 0) {
          setAllLocations(data.allLocations);
        }
        setGamePhase("playing");

        // Reset any previous game state
        setGameResult(null);
        setVotedPlayers([]);

        // Set initial timer from server
        if (data.timer) {
          setTimer(data.timer);
        }
      }
    };

    // สำหรับจัดการการเปลี่ยนเฟสเกม (เพิ่มเติม)
    const handleGamePhaseChanged = (data) => {
      console.log("Game phase changed:", data);
      if (data && data.phase) {
        setGamePhase(data.phase);
      }
    };


    // Handle incoming chat messages
    const handleReceiveMessage = (msg) => {
      console.log("Message received:", msg);
      setMessages(prev => [...prev, msg]);
    };

    // Handle timer updates
    const handleUpdateTimer = (time) => {
      console.log("Timer update:", time);
      setTimer(time);
    };

    // Handle start timer event
    const handleStartTimer = (time) => {
      console.log("Start timer:", time);
      setTimer(time);
    };

    // Handle transition to voting phase
    const handleStartVoting = () => {
      console.log("VOTING PHASE STARTED - SERVER EVENT");
      setGamePhase("voting");
      setVotedPlayers([]);
    };

    // Handle player votes
    const handlePlayerVoted = ({ voterId, voterName }) => {
      console.log(`Player voted: ${voterName}`);
      setVotedPlayers(prev => [...prev, voterId]);
    };

    // Handle game results
    const handleGameOver = (result) => {
      console.log("Game over! Result:", result);
      setGameResult(result);
      setGamePhase("result");
    };

    // Handle player disconnect event
    const handlePlayerDisconnected = ({ playerId, playerName }) => {
      console.log(`Player disconnected: ${playerName}`);
      // Add message to chat
      setMessages(prev => [
        ...prev,
        {
          sender: "System",
          message: `${playerName} has disconnected.`
        }
      ]);
    };

    // Handle error messages
    const handleErrorMessage = (data) => {
      console.error("Error from server:", data.message);
      alert(data.message);
    };

    // Register event listeners
    socket.on("updatePlayers", handleUpdatePlayers);
    socket.on("gameStarted", handleGameStarted);
    socket.on("gamePhaseChanged", handleGamePhaseChanged);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("updateTimer", handleUpdateTimer);
    socket.on("startTimer", handleStartTimer);
    socket.on("startVoting", handleStartVoting);
    socket.on("playerVoted", handlePlayerVoted);
    socket.on("gameOver", handleGameOver);
    socket.on("playerDisconnected", handlePlayerDisconnected);
    socket.on("errorMessage", handleErrorMessage);

    // Clean up listeners when component unmounts
    return () => {
      console.log("Cleaning up socket listeners");
      socket.off("updatePlayers", handleUpdatePlayers);
      socket.off("gameStarted", handleGameStarted);
      socket.off("gamePhaseChanged", handleGamePhaseChanged);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("updateTimer", handleUpdateTimer);
      socket.off("startTimer", handleStartTimer);
      socket.off("startVoting", handleStartVoting);
      socket.off("playerVoted", handlePlayerVoted);
      socket.off("gameOver", handleGameOver);
      socket.off("playerDisconnected", handlePlayerDisconnected);
      socket.off("errorMessage", handleErrorMessage);
    };
  }, [socket, roomCode, playerName, isConnected, navigate]);

  // Send chat message
  const sendMessage = () => {
    if (message.trim() && socket && isConnected && roomCode) {
      console.log(`Sending message to room ${roomCode}:`, message);
      socket.emit("sendMessage", { roomCode, message: message.trim() });
      setMessage("");
    }
  };

  // Cast vote during voting phase
  const castVote = (targetId) => {
    if (socket && isConnected && gamePhase === "voting" && roomCode) {
      console.log(`Casting vote for player: ${targetId}`);
      socket.emit("castVote", { roomCode, targetId });
    }
  };

  // Return to lobby after game ends
  const returnToLobby = () => {
    navigate("/lobby");
  };

  // Show connection status message if disconnected
  if (!isConnected) {
    return (
      <div className="disconnected-screen">
        <h2>Disconnected from server</h2>
        <p>Attempting to reconnect...</p>
        <button
          className="reconnect-button"
          onClick={() => {
            if (socket) {
              console.log("Manually attempting to reconnect...");
              socket.connect();
              if (socket.connected && roomCode && playerName) {
                socket.emit("joinRoom", { roomCode, playerName });
              }
            }
          }}
        >
          Try Reconnecting Manually
        </button>
        <button
          className="return-button"
          onClick={() => navigate("/lobby")}
        >
          Return to Lobby
        </button>
      </div>
    );
  }

  // Debug Info
  const renderDebugInfo = () => (
    <div className="debug-info" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <p>Phase: {gamePhase} | Role: {role}</p>
      <p>Location: {location} | Timer: {timer}s</p>
    </div>
  );

  // Render the appropriate game phase
  return (
    <div className="game-page">
      {renderDebugInfo()}

      {gamePhase === "playing" && (
        <GameUI
          role={role}
          location={location}
          options={allLocations}
          messages={messages}
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          playerName={playerName}
          roomCode={roomCode}
          timer={timer}
        />
      )}

      {gamePhase === "voting" && (
        <VotingUI
          players={players}
          castVote={castVote}
          votedPlayers={votedPlayers}
          currentPlayerId={socket?.id}
          hasVoted={votedPlayers.includes(socket?.id)}
          roomCode={roomCode}
        />
      )}

      {gamePhase === "result" && gameResult && (
        <GameResultUI
          result={gameResult}
          returnToLobby={returnToLobby}
          roomCode={roomCode}
        />
      )}
    </div>
  );
};

export default Game;
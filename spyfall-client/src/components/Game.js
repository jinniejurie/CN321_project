import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "./SocketContext";
import GameUI from "./GameUI";
import VoteUI from "./VoteUI";

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
  const [gameState, setGameState] = useState("playing"); // playing, voting, results
  const [gameResults, setGameResults] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const navigate = useNavigate();

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
      setGameState("playing");
      setHasVoted(false);
    };

    const onReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onUpdateTimer = (time) => {
      setTimer(time);
      // When timer reaches 0, trigger the voting phase
      if (time === 0) {
        setGameState("voting");
      }
    };

    const onStartVoting = () => {
      setGameState("voting");
      setHasVoted(false);
    };

    const onGameOver = (results) => {
      setGameResults(results);
      setGameState("results");
    };

    const onGameReset = () => {
      // Reset game state for next game
      setGameState("playing");
      setTimer(300);
      setMessages([]);
      setHasVoted(false);
    };

    // Register event listeners
    socket.on("updatePlayers", onUpdatePlayers);
    socket.on("gameStarted", onGameStarted);
    socket.on("receiveMessage", onReceiveMessage);
    socket.on("updateTimer", onUpdateTimer);
    socket.on("startVoting", onStartVoting);
    socket.on("gameOver", onGameOver);
    socket.on("gameReset", onGameReset);

    // Clean up listeners when component unmounts
    return () => {
      socket.off("updatePlayers", onUpdatePlayers);
      socket.off("gameStarted", onGameStarted);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("updateTimer", onUpdateTimer);
      socket.off("startVoting", onStartVoting);
      socket.off("gameOver", onGameOver);
      socket.off("gameReset", onGameReset);
    };
  }, [socket, playerName, isConnected]);

  const sendMessage = () => {
    if (message.trim() && socket && isConnected) {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  const submitVote = (votedPlayerName) => {
    if (socket && isConnected && !hasVoted) {
      socket.emit("submitVote", votedPlayerName);
      setHasVoted(true);
    }
  };

  const returnToLobby = () => {
    if (socket && isConnected) {
      socket.emit("returnToLobby");
      navigate("/lobby");
    }
  };

  // Format timer for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render game content based on current state
  const renderGameContent = () => {
    switch (gameState) {
      case "voting":
        return hasVoted ? (
          <div className="waiting-for-votes">
            <h2>Vote submitted!</h2>
            <p>Waiting for other players to vote...</p>
          </div>
        ) : (
          <VoteUI 
            players={players} 
            currentPlayer={playerName} 
            onSubmitVote={submitVote} 
          />
        );
      
      case "results":
        return (
          <div className="game-results">
            <h2>Game Over!</h2>
            
            <div className="result-text">
              {gameResults.winner === "civilians" ? (
                <p>The civilians have won! The spy has been caught!</p>
              ) : (
                <p>The spy has won! They remained undetected.</p>
              )}
            </div>
            
            <div className="spy-reveal">
              The spy was: <strong>{gameResults.spy}</strong>
            </div>
            
            <div className="location-reveal">
              The location was: <strong>{gameResults.location}</strong>
            </div>
            
            <div className="vote-results">
              <h3>Voting Results:</h3>
              {gameResults.votes.map((vote, index) => (
                <div key={index} className="vote-result-item">
                  <span>{vote.voter}</span>
                  <span>voted for</span>
                  <span>{vote.votedFor}</span>
                </div>
              ))}
            </div>
            
            <button className="reset-button" onClick={returnToLobby}>
              Return to Lobby
            </button>
          </div>
        );
      
      case "playing":
      default:
        return (
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
        );
    }
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <h2>Spyfall Game</h2>
        <div className="player-list">
          Players: {players.map(p => p.name).join(", ")}
        </div>
        {gameState === "playing" && (
          <div className="game-timer">
            Time: {formatTime(timer)}
          </div>
        )}
        {!isConnected && (
          <div className="connection-status">
            Disconnected from server. Trying to reconnect...
          </div>
        )}
      </div>
      
      {renderGameContent()}
    </div>
  );
};

export default Game;
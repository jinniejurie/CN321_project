import React, { useState, useEffect, useRef } from "react";
import "../styles/Game.css";

const GameUI = ({ 
  role, 
  location, 
  options = [], 
  messages = [], 
  message = "", 
  setMessage,
  sendMessage,
  playerName,
  roomCode,
  timer
}) => {
  const [showLocationInfo, setShowLocationInfo] = useState(true);
  const messagesEndRef = useRef(null);

  // Automatically scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timer for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-container">
      <div className="game-info-panel">
        <div className="game-info-header">
          <h3 className="room-code">Room: {roomCode}</h3>
          <div className="timer-display">{formatTime(timer)}</div>
        </div>
        
        <div className="player-info">
          <div className="avatar"></div>
          <h3>{playerName}</h3>
          <div className="role-info">
            <p>Your Role: <strong>{role || "Waiting..."}</strong></p>
            <p>Location: <strong>{location || "Waiting..."}</strong></p>
          </div>

          <button 
            className="toggle-locations-btn"
            onClick={() => setShowLocationInfo(!showLocationInfo)}
          >
            {showLocationInfo ? "Hide Locations" : "Show Locations"}
          </button>

          {/* Show Possible Locations */}
          {showLocationInfo && (
            <div className="location-options">
              <h4>Possible Locations:</h4>
              <div className="location-list">
                <ul>
                  {options.map((opt, index) => (
                    <li key={index}>{opt}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="chat-room">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <p className="empty-chat">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender === playerName ? 'own-message' : ''}`}>
                <div className={`chat-avatar ${msg.sender === playerName ? 'right' : 'left'}`}></div>
                <div className={`chat-text ${msg.sender === playerName ? 'right' : 'left'}`}>
                  <strong>{msg.sender}</strong>: {msg.message}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={2}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

      <div className="game-tips">
        <h4>Tips</h4>
        <ul>
          <li>If you're a civilian, ask subtle questions about the location</li>
          <li>If you're the spy, try to blend in without revealing yourself</li>
          <li>Listen carefully to other players' responses</li>
          <li>Time your questions strategically</li>
        </ul>
      </div>
    </div>
  );
};

export default GameUI;
import React from "react";
import "./Game.css";

const GameUI = ({ 
  role, 
  location, 
  options = [], 
  messages = [], 
  message, 
  setMessage, 
  sendMessage,
  playerName 
}) => {
  console.log("Role in GameUI:", role);
  console.log("Location in GameUI:", location);
  console.log("Available locations:", options);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="game-container">
      <div className="player-info">
        <div className="avatar"></div>
        <h3>{playerName}</h3>
        <div className="role-info">
          <p>Your Role: <strong>{role || "Waiting..."}</strong></p>
          <p>Location: <strong>{location || "Waiting..."}</strong></p>
        </div>

        {/* Show Possible Locations for everyone */}
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
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default GameUI;

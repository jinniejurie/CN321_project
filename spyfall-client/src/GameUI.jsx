import React from "react";
import "./Game.css";

const GameUI = ({ role, location, options = [], messages = [], message, setMessage, sendMessage }) => {
  console.log("Role in GameUI:", role);
  console.log("Location in GameUI:", location);

  return (
    <div className="game-container">
      <div className="player-info">
        <div className="avatar"></div>
        <h3>Player 1</h3>
        <p>Location: {role !== "Spy" ? location : "???"}</p>

        <div className="location-options">
          {options.map((opt, index) => (
            <p key={index}>{opt}</p>
          ))}
        </div>
      </div>

      <div className="chat-room">
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <div className="chat-avatar"></div>
            <div className="chat-text">
              <strong>{msg.sender}</strong>: {msg.message}
            </div>
          </div>
        ))}

        <div className="chat-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default GameUI;

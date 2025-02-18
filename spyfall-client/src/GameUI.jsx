// GameUI.jsx
import React from "react";
import "./Game.css";

const GameUI = ({ role, location, timer, messages, message, setMessage, sendMessage }) => {
  return (
    <div className="game-container">
      <h2>Game Started</h2>
      <h3>Your Role: {role || "Waiting..."}</h3>
      {role !== "Spy" && <h3>Location: {location || "Waiting..."}</h3>}
      <h3>Time Left: {Math.floor(timer / 60)}:{("0" + (timer % 60)).slice(-2)}</h3>

      <div className="chat-room">
        <h3>Chat Room</h3>
        <div className="message-box">
          {messages.map((msg, index) => (
            <p key={index}>{msg.sender}: {msg.message}</p>
          ))}
        </div>
        <div className="input-container">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

const Game = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [timer, setTimer] = useState(300);

  useEffect(() => {
    socket.on("gameStarted", ({ role, location }) => {
      console.log("Received gameStarted event:", { role, location });
      setRole(role);
      setLocation(location);
    });

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("updateTimer", (time) => {
      setTimer(time);
    });

    socket.on("gameOver", ({ result }) => {
      alert(result);
    });

    return () => {
      socket.off("gameStarted");
      socket.off("receiveMessage");
      socket.off("updateTimer");
      socket.off("gameOver");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  return (
    <div>
      <h2>Game Started</h2>
      <h3>Your Role: {role || "Waiting..."}</h3>
      {role !== "Spy" && <h3>Location: {location || "Waiting..."}</h3>}
      <h3>Time Left: {Math.floor(timer / 60)}:{("0" + (timer % 60)).slice(-2)}</h3>

      <div>
        <h3>Chat Room</h3>
        <div>
          {messages.map((msg, index) => (
            <p key={index}>{msg.sender}: {msg.message}</p>
          ))}
        </div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Game;
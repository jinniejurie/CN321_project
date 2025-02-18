// Game.js
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import GameUI from "./GameUI";

const socket = io("http://localhost:4000");

const Game = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [timer, setTimer] = useState(300);

  useEffect(() => {
    socket.on("gameStarted", ({ role, location }) => {
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
    <GameUI
      role={role}
      location={location}
      timer={timer}
      messages={messages}
      message={message}
      setMessage={setMessage}
      sendMessage={sendMessage}
    />
  );
};

export default Game;
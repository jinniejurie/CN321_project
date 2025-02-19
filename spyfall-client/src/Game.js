import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import GameUI from "./GameUI";

const Game = () => {
  const socketRef = useRef(null);
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(300);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:4000");

      socketRef.current.on("connect", () => {
        console.log("Connected to Socket! ID:", socketRef.current.id);
      });

      socketRef.current.on("disconnect", () => {
        console.log("Disconnected from server");
      });

      socketRef.current.on("gameStarted", ({ role, location }) => {
        console.log("Game Started! Role:", role, "Location:", location);
        setRole(role);
        setLocation(location);
      });

      socketRef.current.on("receiveMessage", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      socketRef.current.on("updateTimer", (time) => {
        setTimer(time);
      });

      socketRef.current.on("gameOver", ({ result }) => {
        alert(result);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("gameStarted");
        socketRef.current.off("receiveMessage");
        socketRef.current.off("updateTimer");
        socketRef.current.off("gameOver");
      }
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socketRef.current.emit("sendMessage", message);
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

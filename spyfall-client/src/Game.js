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
    // ฟัง Event ตอนเกมเริ่ม
    socket.on("gameStarted", (data) => {
      console.log("Received gameStarted event:", data);
      if (data) {
        console.log("Data received -> Role:", data.role, "Location:", data.location);
        setRole(data.role);
        setLocation(data.location);
      } else {
        console.log("gameStarted event received, but data is empty!");
      }
    });

    // ฟัง Event สำหรับข้อความแชท
    socket.on("receiveMessage", (msg) => {
      console.log("Received message:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    // ฟัง Event นับเวลาถอยหลัง
    socket.on("updateTimer", (time) => {
      setTimer(time);
    });

    // ฟัง Event เมื่อเกมจบ
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

  // เช็กว่าค่า role/location อัปเดตจริงไหม (ใช้ log ปกติ แทน useEffect ซ้อนกัน)
  console.log("State updated -> Role:", role, "Location:", location);

  const sendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
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
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const players = [];
const locations = ["Beach", "Restaurant", "Airport", "Bank", "School"];
let gameData = { location: "", spy: null, timer: 300 };

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("joinGame", (name) => {
    if (!players.some((p) => p.id === socket.id)) {
      players.push({ id: socket.id, name });
      console.log(`Player joined: ${name} (ID: ${socket.id})`);
      io.emit("updatePlayers", players);

      if (players.length === 4) {
        startGame();
      }
    }
  });

  socket.on("sendMessage", (message) => {
    const player = players.find((p) => p.id === socket.id);
    if (player) {
      io.emit("receiveMessage", { sender: player.name, message });
    }
  });

  socket.on("disconnect", () => {
    const index = players.findIndex((p) => p.id === socket.id);
    if (index !== -1) {
      console.log(`Player left: ${players[index].name} (ID: ${socket.id})`);
      players.splice(index, 1);
      io.emit("updatePlayers", players);
    }
  });
});

function startGame() {
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  const spyIndex = Math.floor(Math.random() * players.length);

  gameData.location = randomLocation;
  gameData.spy = players[spyIndex].id;
  gameData.timer = 300;

  console.log(`🎮 Game started! Location: ${randomLocation}, Spy: ${players[spyIndex].name}`);

  players.forEach((player) => {
    const role = player.id === gameData.spy ? "Spy" : "Civilian";

    console.log(`Sending gameStarted to ${player.id} (Role: ${role}, Location: ${role === "Spy" ? "Unknown" : gameData.location})`);

    io.to(player.id).emit("gameStarted", { role, location: role === "Spy" ? "Unknown" : gameData.location });
  });

  io.emit("startTimer", gameData.timer);
  startTimer();
}

function startTimer() {
  let interval = setInterval(() => {
    if (gameData.timer > 0) {
      gameData.timer--;
      io.emit("updateTimer", gameData.timer);
    } else {
      io.emit("gameOver", { result: "Time's up! Spy wins!" });
      clearInterval(interval);
    }
  }, 1000);
}

server.listen(4000, () => console.log("Server running on port 4000"));

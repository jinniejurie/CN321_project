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

let players = [];
const locations = ["Beach", "Restaurant", "Airport", "Bank", "School"];
let gameData = { location: "", spyId: null, timer: 300 };
let gameActive = false;
let gameInterval = null;

// Add this middleware to serve static files if needed
app.use(express.static('public'));

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle player joining with a name
  socket.on("joinGame", (name) => {
    // Make sure name is unique by adding a suffix if needed
    let uniqueName = name;
    let counter = 1;
    while (players.some(p => p.name === uniqueName && p.id !== socket.id)) {
      uniqueName = `${name}_${counter}`;
      counter++;
    }
    
    // Check if this player already exists (reconnection)
    const existingPlayerIndex = players.findIndex(p => p.id === socket.id);
    
    if (existingPlayerIndex === -1) {
      // New player
      players.push({ id: socket.id, name: uniqueName });
      console.log(`Player joined: ${uniqueName} (ID: ${socket.id})`);
    } else {
      // Update existing player's name
      players[existingPlayerIndex].name = uniqueName;
      console.log(`Player name updated: ${uniqueName} (ID: ${socket.id})`);
    }
    
    // Send updated player list to all clients
    io.emit("updatePlayers", players);
    
    // If game is already active, send role and location to the reconnected player
    if (gameActive) {
      const playerObj = players.find(p => p.id === socket.id);
      if (playerObj) {
        const isSpy = socket.id === gameData.spyId;
        const role = isSpy ? "Spy" : "Civilian";
        const locationToSend = isSpy ? "Unknown" : gameData.location;
        
        console.log(`Sending game data to reconnected player ${playerObj.name}: Role=${role}, Location=${locationToSend}`);
        socket.emit("gameStarted", { role, location: locationToSend });
        socket.emit("updateTimer", gameData.timer);
      }
    }
    
    // Start game if we have enough players and game isn't already active
    if (players.length >= 4 && !gameActive) {
      startGame();
    }
  });

  socket.on("sendMessage", (message) => {
    const player = players.find((p) => p.id === socket.id);
    if (player) {
      console.log(`Message from ${player.name}: ${message}`);
      io.emit("receiveMessage", { sender: player.name, message });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Don't remove the player if game is active, but log it
    if (gameActive) {
      const player = players.find(p => p.id === socket.id);
      if (player) {
        console.log(`Player disconnected during game: ${player.name}`);
      }
    } else {
      // Remove the player if game isn't active
      const index = players.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        console.log(`Player left: ${players[index].name}`);
        players.splice(index, 1);
        io.emit("updatePlayers", players);
      }
    }
  });
});

function startGame() {
  gameActive = true;
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  const spyIndex = Math.floor(Math.random() * players.length);
  const spy = players[spyIndex];

  gameData.location = randomLocation;
  gameData.spyId = spy.id;
  gameData.timer = 300;

  console.log(`Game started! Location: ${randomLocation}, Spy: ${spyIndex+1} (ID: ${spy.id})`);

  // Send role and location to each player
  players.forEach((player) => {
    const isSpy = player.id === gameData.spyId;
    const role = isSpy ? "Spy" : "Civilian";
    const locationToSend = isSpy ? "Unknown" : gameData.location;

    console.log(`Sending gameStarted to ${player.name}: Role=${role}, Location=${locationToSend}`);
    io.to(player.id).emit("gameStarted", { 
      role, 
      location: locationToSend,
      // Send all possible locations to everyone
      allLocations: locations
    });
  });

  // Start the timer and broadcast to all clients
  io.emit("startTimer", gameData.timer);
  startTimer();
}

function startTimer() {
  // Clear any existing interval
  if (gameInterval) {
    clearInterval(gameInterval);
  }

  gameInterval = setInterval(() => {
    if (gameData.timer > 0) {
      gameData.timer--;
      io.emit("updateTimer", gameData.timer);
    } else {
      io.emit("gameOver", { result: "Time's up!" });
      resetGame();
    }
  }, 1000);
}

function resetGame() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  
  gameActive = false;
  // Don't clear players array, but reset game data
  gameData = { location: "", spyId: null, timer: 300 };
  
  io.emit("gameReset");
  console.log("Game has been reset");
}

server.listen(4000, () => console.log("Server running on port 4000"));
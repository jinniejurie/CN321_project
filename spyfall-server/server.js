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
const locations = require('./locations');
let gameData = { 
  location: "", 
  spyId: null, 
  timer: 100, 
  votes: [], 
  gamePhase: "waiting" // waiting, playing, voting, ended
};
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
    if (gameData.gamePhase === "playing" || gameData.gamePhase === "voting") {
      const playerObj = players.find(p => p.id === socket.id);
      if (playerObj) {
        const isSpy = socket.id === gameData.spyId;
        const role = isSpy ? "Spy" : "Civilian";
        const locationToSend = isSpy ? "Unknown" : gameData.location;
        
        console.log(`Sending game data to reconnected player ${playerObj.name}: Role=${role}, Location=${locationToSend}`);
        socket.emit("gameStarted", { 
          role, 
          location: locationToSend,
          allLocations: locations 
        });
        socket.emit("updateTimer", gameData.timer);
        
        // If we're in voting phase, tell the client
        if (gameData.gamePhase === "voting") {
          socket.emit("startVoting");
        }
      }
    }
    
    // Start game if we have enough players and game isn't already active
    if (players.length >= 4 && gameData.gamePhase === "waiting") {
      startGame();
    }
  });

  socket.on("sendMessage", (message) => {
    const player = players.find((p) => p.id === socket.id);
    if (player && (gameData.gamePhase === "playing" || gameData.gamePhase === "voting")) {
      console.log(`Message from ${player.name}: ${message}`);
      io.emit("receiveMessage", { sender: player.name, message });
    }
  });

  // Handle vote submission
  socket.on("submitVote", (votedPlayerName) => {
    if (gameData.gamePhase !== "voting") return;
    
    const voter = players.find(p => p.id === socket.id);
    if (!voter) return;
    
    const votedPlayer = players.find(p => p.name === votedPlayerName);
    if (!votedPlayer) return;
    
    // Check if this player has already voted
    const existingVoteIndex = gameData.votes.findIndex(v => v.voterId === socket.id);
    if (existingVoteIndex !== -1) {
      // Update existing vote
      gameData.votes[existingVoteIndex].votedForId = votedPlayer.id;
      gameData.votes[existingVoteIndex].votedFor = votedPlayer.name;
    } else {
      // Add new vote
      gameData.votes.push({
        voterId: socket.id,
        voter: voter.name,
        votedForId: votedPlayer.id,
        votedFor: votedPlayer.name
      });
    }
    
    console.log(`Vote recorded: ${voter.name} voted for ${votedPlayer.name}`);
    
    // Check if all players have voted
    if (gameData.votes.length === players.length) {
      endGame();
    }
  });

  // Handle player requesting to return to lobby
  socket.on("returnToLobby", () => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      console.log(`${player.name} is returning to lobby`);
      
      // If the game is still in progress, keep the player in the list
      // Otherwise, this is the same as leaving
      if (gameData.gamePhase === "ended") {
        // เรียกฟังก์ชัน resetGame เมื่อผู้เล่นคนแรกกด Return to Lobby
        resetGame();
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Don't remove the player if game is active, but log it
    if (gameData.gamePhase !== "waiting") {
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
  gameData.gamePhase = "playing";
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  const spyIndex = Math.floor(Math.random() * players.length);
  const spy = players[spyIndex];

  gameData.location = randomLocation;
  gameData.spyId = spy.id;
  gameData.timer = 100;
  gameData.votes = [];

  console.log(`Game started! Location: ${randomLocation}, Spy: ${spy.name} (ID: ${spy.id})`);

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
      startVotingPhase();
    }
  }, 1000);
}

function startVotingPhase() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  
  gameData.gamePhase = "voting";
  gameData.votes = [];
  
  // Notify all clients to start voting
  io.emit("startVoting");
  console.log("Voting phase started");
}

function endGame() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  
  gameData.gamePhase = "ended";
  
  // Count votes for the spy
  const votesForSpy = gameData.votes.filter(v => v.votedForId === gameData.spyId).length;
  const majorityVotedForSpy = votesForSpy > players.length / 2;
  
  // Get spy name
  const spy = players.find(p => p.id === gameData.spyId);
  const spyName = spy ? spy.name : "Unknown";
  
  // Determine winner
  const winner = majorityVotedForSpy ? "civilians" : "spy";
  
  // Send game results to all clients
  io.emit("gameOver", {
    winner,
    spy: spyName,
    location: gameData.location,
    votes: gameData.votes.map(v => ({
      voter: v.voter,
      votedFor: v.votedFor
    }))
  });
  
  console.log(`Game over! Winner: ${winner}, Spy: ${spyName}, Location: ${gameData.location}`);
  
}

function resetGame() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  
  gameData.gamePhase = "waiting";
  // Don't clear players array, but reset game data
  gameData.location = "";
  gameData.spyId = null;
  gameData.timer = 100;
  gameData.votes = [];
  
  io.emit("gameReset");
  console.log("Game has been reset");
}

server.listen(4000, () => console.log("Server running on port 4000"));
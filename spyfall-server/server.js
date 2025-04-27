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
  timer: 300, 
  votes: [], 
  gamePhase: "waiting" 
};
let gameInterval = null;

app.use(express.static('public'));

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("joinGame", (name) => {
    let uniqueName = name;
    let counter = 1;
    while (players.some(p => p.name === uniqueName && p.id !== socket.id)) {
      uniqueName = `${name}_${counter}`;
      counter++;
    }
    
    const existingPlayerIndex = players.findIndex(p => p.id === socket.id);
    
    if (existingPlayerIndex === -1) {
      players.push({ id: socket.id, name: uniqueName });
      console.log(`Player joined: ${uniqueName} (ID: ${socket.id})`);
    } else {
      players[existingPlayerIndex].name = uniqueName;
      console.log(`Player name updated: ${uniqueName} (ID: ${socket.id})`);
    }
    
    io.emit("updatePlayers", players);
    
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
        
        if (gameData.gamePhase === "voting") {
          socket.emit("startVoting");
        }
      }
    }
    
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

  socket.on("submitVote", (votedPlayerName) => {
    if (gameData.gamePhase !== "voting") return;
    
    const voter = players.find(p => p.id === socket.id);
    if (!voter) return;
    
    const votedPlayer = players.find(p => p.name === votedPlayerName);
    if (!votedPlayer) return;
    
    const existingVoteIndex = gameData.votes.findIndex(v => v.voterId === socket.id);
    if (existingVoteIndex !== -1) {
      gameData.votes[existingVoteIndex].votedForId = votedPlayer.id;
      gameData.votes[existingVoteIndex].votedFor = votedPlayer.name;
    } else {
      gameData.votes.push({
        voterId: socket.id,
        voter: voter.name,
        votedForId: votedPlayer.id,
        votedFor: votedPlayer.name
      });
    }
    
    console.log(`Vote recorded: ${voter.name} voted for ${votedPlayer.name}`);
    
    if (gameData.votes.length === players.length) {
      endGame();
    }
  });

  socket.on("returnToLobby", () => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      console.log(`${player.name} is returning to lobby`);
      
      if (gameData.gamePhase === "ended") {
        resetGame();
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (gameData.gamePhase !== "waiting") {
      const player = players.find(p => p.id === socket.id);
      if (player) {
        console.log(`Player disconnected during game: ${player.name}`);
      }
    } else {
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
  gameData.timer = 300;
  gameData.votes = [];

  console.log(`Game started! Location: ${randomLocation}, Spy: ${spy.name} (ID: ${spy.id})`);

  players.forEach((player) => {
    const isSpy = player.id === gameData.spyId;
    const role = isSpy ? "Spy" : "Civilian";
    const locationToSend = isSpy ? "Unknown" : gameData.location;

    console.log(`Sending gameStarted to ${player.name}: Role=${role}, Location=${locationToSend}`);
    io.to(player.id).emit("gameStarted", { 
      role, 
      location: locationToSend,
      allLocations: locations
    });
  });
  io.emit("startTimer", gameData.timer);
  startTimer();
}

function startTimer() {
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
  
  io.emit("startVoting");
  console.log("Voting phase started");
}

function endGame() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  
  gameData.gamePhase = "ended";
  
  const votesForSpy = gameData.votes.filter(v => v.votedForId === gameData.spyId).length;
  const majorityVotedForSpy = votesForSpy > players.length / 2;
  
  const spy = players.find(p => p.id === gameData.spyId);
  const spyName = spy ? spy.name : "Unknown";
  
  const winner = majorityVotedForSpy ? "civilians" : "spy";
  
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
  gameData.location = "";
  gameData.spyId = null;
  gameData.timer = 300;
  gameData.votes = [];
  
  io.emit("gameReset");
  console.log("Game has been reset");
}

server.listen(4000, () => console.log("Server running on port 4000"));
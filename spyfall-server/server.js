const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
require('dotenv').config();

// Import locations from separate file
const locations = require('./locations');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// เก็บข้อมูลห้องในหน่วยความจำ
const rooms = new Map();
const gameTimers = new Map();

// สร้างรหัสห้องที่ไม่ซ้ำกัน
function generateRoomCode() {
  while (true) {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    if (!rooms.has(code)) {
      return code;
    }
  }
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API route to check server status
app.get('/api/status', (req, res) => {
  res.json({ status: 'online' });
});

// API route to view all rooms (สำหรับการพัฒนาเท่านั้น)
app.get('/api/rooms', (req, res) => {
  const roomsData = Array.from(rooms.entries()).map(([code, room]) => ({
    code,
    playersCount: room.players.length,
    isActive: room.gameState.active,
    settings: room.settings
  }));
  res.json(roomsData);
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // สร้างห้องใหม่
  socket.on("createRoom", ({ playerName }) => {
    try {
      console.log(`Creating room for player: ${playerName}`);
      
      if (!playerName || typeof playerName !== 'string') {
        return socket.emit("errorMessage", { message: "Invalid player name" });
      }

      // สร้างรหัสห้อง
      const roomCode = generateRoomCode();
      
      // สร้างข้อมูลห้อง
      const newRoom = {
        roomCode,
        host: socket.id,
        hostName: playerName,
        players: [{ id: socket.id, name: playerName, isHost: true, isConnected: true }],
        settings: {
          gameTimeInMinutes: 5,
          spiesCount: 1,
          maxPlayers: 8
        },
        gameState: {
          active: false,
          location: null,
          spyIds: [],
          votes: [],
          startTime: null,
          endTime: null
        }
      };

      // เก็บข้อมูลห้อง
      rooms.set(roomCode, newRoom);
      socket.join(roomCode);

      console.log(`Room created: ${roomCode} by ${playerName}`);

      // แจ้งผู้เล่น
      socket.emit("roomCreated", {
        roomCode: roomCode,
        isHost: true,
        settings: newRoom.settings
      });

      // อัปเดตรายชื่อผู้เล่น
      io.to(roomCode).emit("updatePlayers", {
        players: newRoom.players,
        host: newRoom.hostName,
        hostId: newRoom.host
      });
      
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("errorMessage", { message: "Failed to create room" });
    }
  });

  // เข้าร่วมห้อง
  socket.on("joinRoom", ({ roomCode, playerName }) => {
    try {
      console.log(`Player ${playerName} attempting to join room ${roomCode}`);
      
      if (!roomCode || !playerName) {
        return socket.emit("errorMessage", { message: "Invalid room code or player name" });
      }

      // ตรวจสอบว่าห้องมีอยู่จริง
      if (!rooms.has(roomCode)) {
        return socket.emit("errorMessage", { message: "Room not found" });
      }

      const room = rooms.get(roomCode);

      // ตรวจสอบว่าเกมเริ่มไปแล้วหรือยัง
      if (room.gameState.active) {
        const existingPlayer = room.players.find(p => p.id === socket.id);
        if (!existingPlayer) {
          return socket.emit("errorMessage", { message: "Game already in progress" });
        }
      }

      // ตรวจสอบจำนวนผู้เล่นเต็มหรือยัง
      if (room.players.length >= room.settings.maxPlayers) {
        const existingPlayer = room.players.find(p => p.id === socket.id);
        if (!existingPlayer) {
          return socket.emit("errorMessage", { message: "Room is full" });
        }
      }

      // ตรวจสอบว่าผู้เล่นอยู่ในห้องนี้แล้วหรือไม่ (อาจเป็นการเชื่อมต่อใหม่)
      const existingPlayerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (existingPlayerIndex !== -1) {
        // อัปเดตสถานะการเชื่อมต่อ
        room.players[existingPlayerIndex].isConnected = true;
        
        socket.join(roomCode);
        
        // ส่งข้อมูลห้องกลับไป
        socket.emit("roomJoined", {
          roomCode,
          playerName: room.players[existingPlayerIndex].name,
          isHost: room.players[existingPlayerIndex].isHost,
          settings: room.settings
        });
        
        console.log(`Player reconnected to room ${roomCode}: ${room.players[existingPlayerIndex].name}`);
      } else {
        // ทำให้ชื่อไม่ซ้ำกัน
        let uniqueName = playerName;
        let counter = 1;
        while (room.players.some(p => p.name === uniqueName)) {
          uniqueName = `${playerName}_${counter}`;
          counter++;
        }
        
        // เพิ่มผู้เล่นเข้าห้อง
        room.players.push({
          id: socket.id,
          name: uniqueName,
          isHost: false,
          isConnected: true
        });
        
        socket.join(roomCode);
        
        // ส่งข้อมูลห้องกลับไป
        socket.emit("roomJoined", {
          roomCode,
          playerName: uniqueName,
          isHost: false,
          settings: room.settings
        });
        
        console.log(`Player joined room ${roomCode}: ${uniqueName}`);
      }

      // อัปเดตรายชื่อผู้เล่นสำหรับทุกคนในห้อง
      io.to(roomCode).emit("updatePlayers", {
        players: room.players,
        host: room.hostName,
        hostId: room.host
      });

      // ตรวจสอบว่ามีผู้เล่นพอเริ่มเกมหรือไม่
      if (room.players.length >= 4) {
        io.to(roomCode).emit("canStartGame", true);
      }

      // ถ้าเกมเริ่มไปแล้ว ส่งข้อมูลเกมให้ผู้เล่น
      if (room.gameState.active) {
        const playerObj = room.players.find(p => p.id === socket.id);
        if (playerObj) {
          const isSpy = room.gameState.spyIds.includes(socket.id);
          const role = isSpy ? "Spy" : "Civilian";
          const locationToSend = isSpy ? "Unknown" : room.gameState.location;
          
          console.log(`Sending game data to ${playerObj.name}:`, {
            role: role,
            location: locationToSend
          });
          
          socket.emit("gameStarted", { 
            role, 
            location: locationToSend,
            allLocations: locations,
            timer: calculateRemainingTime(room)
          });
          
          socket.emit("updateTimer", calculateRemainingTime(room));
        }
      }
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("errorMessage", { message: "Failed to join room" });
    }
  });

  // อัปเดตการตั้งค่า
  socket.on("updateSettings", ({ roomCode, settings }) => {
    try {
      if (!rooms.has(roomCode)) {
        return socket.emit("errorMessage", { message: "Room not found" });
      }
      
      const room = rooms.get(roomCode);
      
      // ตรวจสอบว่าเป็นโฮสต์
      if (socket.id !== room.host) {
        return socket.emit("errorMessage", { message: "Only the host can update settings" });
      }
      
      console.log(`Updating settings for room ${roomCode}:`, settings);
      
      // อัปเดตการตั้งค่า
      room.settings = {
        ...room.settings,
        ...settings
      };
      
      // แจ้งทุกคนในห้อง
      io.to(roomCode).emit("settingsUpdated", room.settings);
      
      console.log(`Settings updated for room ${roomCode}:`, room.settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      socket.emit("errorMessage", { message: "Failed to update settings" });
    }
  });

  // เริ่มเกม
  socket.on("startGame", ({ roomCode }) => {
    try {
      console.log(`Attempting to start game in room ${roomCode}`);
      
      if (!rooms.has(roomCode)) {
        return socket.emit("errorMessage", { message: "Room not found" });
      }
      
      const room = rooms.get(roomCode);
      
      // ตรวจสอบว่าเป็นโฮสต์
      if (socket.id !== room.host) {
        return socket.emit("errorMessage", { message: "Only the host can start the game" });
      }
      
      // ตรวจสอบจำนวนผู้เล่น
      if (room.players.length < 4) {
        return socket.emit("errorMessage", { message: "Need at least 4 players to start" });
      }
      
      // เลือกสถานที่สุ่ม
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      
      // เลือกสปายตามการตั้งค่า
      const playerIds = room.players.map(p => p.id);
      const spyIds = [];
      
      // สุ่มเลือกตามจำนวนสปายที่ตั้งค่า
      for (let i = 0; i < room.settings.spiesCount; i++) {
        if (playerIds.length > spyIds.length) {
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * playerIds.length);
          } while (spyIds.includes(playerIds[randomIndex]));
          
          spyIds.push(playerIds[randomIndex]);
        }
      }
      
      // คำนวณเวลาสิ้นสุดเกม
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (room.settings.gameTimeInMinutes * 60 * 1000));
      
      // อัปเดตสถานะเกม
      room.gameState = {
        active: true,
        location: randomLocation,
        spyIds: spyIds,
        startTime: startTime,
        endTime: endTime,
        votes: []
      };
      
      console.log(`Game started in room ${roomCode}:`);
      console.log(`- Location: ${randomLocation}`);
      console.log(`- Spies: ${spyIds.join(', ')}`);
      console.log(`- Game time: ${room.settings.gameTimeInMinutes} minutes`);
      
      // ส่งข้อมูลเกมให้ผู้เล่นแต่ละคน
      const timerDuration = room.settings.gameTimeInMinutes * 60;
      console.log(`Timer duration set to: ${timerDuration} seconds (${room.settings.gameTimeInMinutes} minutes)`);

      for (const player of room.players) {
        if (!player.isConnected) continue;
        
        const isSpy = spyIds.includes(player.id);
        const role = isSpy ? "Spy" : "Civilian";
        const locationToSend = isSpy ? "Unknown" : randomLocation;
        
        console.log(`Sending game data to ${player.name}:`);
        console.log(`- Role: ${role}`);
        console.log(`- Location: ${locationToSend}`);
        console.log(`- Timer: ${timerDuration} seconds`);
        
        // ส่งข้อมูลเกมโดยตรงไปที่ผู้เล่นแต่ละคน
        io.to(player.id).emit("gameStarted", {
          role: role,
          location: locationToSend,
          allLocations: locations,
          timer: timerDuration
        });
      }
      
      // ส่งตัวจับเวลาให้ทุกคนในห้อง
      io.to(roomCode).emit("startTimer", timerDuration);
      
      // ตั้งเวลาเกม
      startGameTimer(roomCode, timerDuration);
      
    } catch (error) {
      console.error("Error starting game:", error);
      socket.emit("errorMessage", { message: "Failed to start game" });
    }
  });

  // รับข้อความแชท
  socket.on("sendMessage", ({ roomCode, message }) => {
    try {
      if (!rooms.has(roomCode)) return;
      
      const room = rooms.get(roomCode);
      const player = room.players.find(p => p.id === socket.id);
      
      if (player) {
        io.to(roomCode).emit("receiveMessage", {
          sender: player.name,
          message
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  // รับการโหวต
  socket.on("castVote", ({ roomCode, targetId }) => {
    try {
      if (!rooms.has(roomCode)) return;
      
      const room = rooms.get(roomCode);
      if (!room.gameState.active) return;
      
      // ตรวจสอบว่าผู้เล่นได้โหวตไปแล้วหรือไม่
      const existingVoteIndex = room.gameState.votes.findIndex(v => v.voterId === socket.id);
      
      if (existingVoteIndex !== -1) {
        // อัปเดตการโหวต
        room.gameState.votes[existingVoteIndex].targetId = targetId;
      } else {
        // เพิ่มการโหวต
        room.gameState.votes.push({
          voterId: socket.id,
          targetId
        });
      }
      
      // หาชื่อผู้โหวต
      const voter = room.players.find(p => p.id === socket.id);
      
      // แจ้งทุกคนในห้องว่ามีคนโหวต
      io.to(roomCode).emit("playerVoted", {
        voterId: socket.id,
        voterName: voter ? voter.name : "Unknown player"
      });
      
      console.log(`Player ${voter ? voter.name : socket.id} voted in room ${roomCode}`);
      
      // ตรวจสอบว่าทุกคนโหวตหรือยัง (เฉพาะคนที่ยังเชื่อมต่ออยู่)
      const connectedPlayers = room.players.filter(p => p.isConnected);
      if (room.gameState.votes.length >= connectedPlayers.length) {
        endGameWithVotes(roomCode);
      }
    } catch (error) {
      console.error("Error casting vote:", error);
    }
  });

  // ออกจากห้อง
  socket.on("leaveRoom", ({ roomCode }) => {
    try {
      handlePlayerLeaving(socket.id, roomCode);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });

  // จัดการการตัดการเชื่อมต่อ
  socket.on("disconnect", () => {
    try {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // ตรวจสอบทุกห้องที่ผู้เล่นอาจอยู่
      for (const [roomCode, room] of rooms.entries()) {
        if (room.players.some(p => p.id === socket.id)) {
          handlePlayerLeaving(socket.id, roomCode);
        }
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
});

// ฟังก์ชันจัดการผู้เล่นออกจากห้อง
function handlePlayerLeaving(playerId, roomCode) {
  if (!rooms.has(roomCode)) return;
  
  const room = rooms.get(roomCode);
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  
  if (playerIndex === -1) return;
  
  const player = room.players[playerIndex];
  const wasHost = player.isHost;
  
  // ถ้าเกมกำลังเล่นอยู่ ให้ทำเครื่องหมายว่าหลุดการเชื่อมต่อแต่ไม่ลบออก
  if (room.gameState.active) {
    room.players[playerIndex].isConnected = false;
    
    // แจ้งทุกคนว่ามีผู้เล่นหลุดการเชื่อมต่อ
    io.to(roomCode).emit("playerDisconnected", {
      playerId: playerId,
      playerName: player.name
    });
    
    console.log(`Player ${player.name} disconnected from active game in room ${roomCode}`);
    return;
  }
  
  // ลบผู้เล่นออกจากห้อง
  room.players.splice(playerIndex, 1);
  
  // ถ้าเป็นโฮสต์ที่ออก ให้เลือกโฮสต์ใหม่
  if (wasHost && room.players.length > 0) {
    const newHost = room.players[0];
    room.host = newHost.id;
    room.hostName = newHost.name;
    newHost.isHost = true;
    
    // แจ้งโฮสต์ใหม่
    io.to(newHost.id).emit("becameHost");
    console.log(`New host assigned in room ${roomCode}: ${newHost.name}`);
  }
  
  // ถ้าไม่มีผู้เล่นเหลือ ให้ลบห้อง
  if (room.players.length === 0) {
    if (gameTimers.has(roomCode)) {
      clearInterval(gameTimers.get(roomCode));
      gameTimers.delete(roomCode);
    }
    
    rooms.delete(roomCode);
    console.log(`Room ${roomCode} deleted (no players remaining)`);
  } else {
    // อัปเดตรายชื่อผู้เล่นสำหรับผู้เล่นที่เหลือ
    io.to(roomCode).emit("updatePlayers", {
      players: room.players,
      host: room.hostName,
      hostId: room.host
    });
    
    // อัปเดตความสามารถในการเริ่มเกม
    io.to(roomCode).emit("canStartGame", room.players.length >= 4);
    
    console.log(`Player ${player.name} left room ${roomCode}`);
  }
}

// ฟังก์ชันเริ่มตัวจับเวลาเกม
function startGameTimer(roomCode, duration) {
  // ยกเลิกตัวจับเวลาที่มีอยู่
  if (gameTimers.has(roomCode)) {
    clearInterval(gameTimers.get(roomCode));
    gameTimers.delete(roomCode);
  }
  
  let timeRemaining = duration;
  
  console.log(`Starting timer for room ${roomCode}: ${timeRemaining} seconds`);
  
  // ส่งเวลาเริ่มต้นทันที
  io.to(roomCode).emit("updateTimer", timeRemaining);
  
  const timerId = setInterval(() => {
    if (timeRemaining > 0) {
      timeRemaining--;
      
      // ส่งการอัปเดตเวลาไปยังทุกคนในห้อง
      io.to(roomCode).emit("updateTimer", timeRemaining);
      
      // Log เพื่อตรวจสอบการส่งเวลา (ทุก 15 วินาที)
      if (timeRemaining % 15 === 0 || timeRemaining <= 10) {
        console.log(`Timer update for room ${roomCode}: ${timeRemaining} seconds remaining`);
      }
      
    } else {
      // เวลาหมด
      clearInterval(timerId);
      gameTimers.delete(roomCode);
      
      console.log(`Timer finished for room ${roomCode}`);
      
      // ตรวจสอบว่าห้องยังมีอยู่หรือไม่
      if (rooms.has(roomCode)) {
        const room = rooms.get(roomCode);
        if (room && room.gameState.active) {
          console.log(`Starting voting phase for room ${roomCode}`);
          
          // ส่ง event หลายครั้งเพื่อให้แน่ใจว่า client ได้รับ
          io.to(roomCode).emit("startVoting");
          
          // ส่งซ้ำอีกครั้งหลังจาก 1 วินาที เพื่อให้แน่ใจว่าทุกคนได้รับ
          setTimeout(() => {
            io.to(roomCode).emit("startVoting");
            console.log("Sending startVoting event again (retry 1)");
          }, 1000);
          
          setTimeout(() => {
            io.to(roomCode).emit("startVoting");
            console.log("Sending startVoting event again (retry 2)");
          }, 2000);
          
          // ส่ง game phase change เป็นอีกทางเลือกหนึ่ง
          io.to(roomCode).emit("gamePhaseChanged", { phase: "voting" });
        }
      }
    }
  }, 1000);
  
  gameTimers.set(roomCode, timerId);
}

// ฟังก์ชันคำนวณเวลาที่เหลือ
function calculateRemainingTime(room) {
  if (!room.gameState.active || !room.gameState.endTime) return 0;
  
  const now = new Date();
  const endTime = new Date(room.gameState.endTime);
  const remainingMs = endTime - now;
  
  return Math.max(0, Math.floor(remainingMs / 1000));
}

// ฟังก์ชันจบเกมและนับคะแนนโหวต
function endGameWithVotes(roomCode) {
  if (!rooms.has(roomCode)) return;
  
  const room = rooms.get(roomCode);
  if (!room.gameState.active) return;
  
  // ยกเลิกตัวจับเวลา
  if (gameTimers.has(roomCode)) {
    clearInterval(gameTimers.get(roomCode));
    gameTimers.delete(roomCode);
  }
  
  // นับคะแนนโหวต
  const voteCounts = {};
  for (const vote of room.gameState.votes) {
    voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
  }
  
  // หาผู้ที่ถูกโหวตมากที่สุด
  let maxVotes = 0;
  let mostVotedIds = [];
  
  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      mostVotedIds = [playerId];
    } else if (count === maxVotes) {
      mostVotedIds.push(playerId);
    }
  }
  
  // กำหนดผลลัพธ์
  let result;
  
  if (mostVotedIds.length > 1) {
    // มีคะแนนเท่ากัน
    result = {
      outcome: "tie",
      message: "There was a tie in voting! The spy escapes!",
      spyWins: true,
      spies: room.players
        .filter(p => room.gameState.spyIds.includes(p.id))
        .map(p => p.name),
      location: room.gameState.location,
      votes: room.gameState.votes.map(v => {
        const voter = room.players.find(p => p.id === v.voterId);
        const target = room.players.find(p => p.id === v.targetId);
        return {
          voter: voter ? voter.name : "Unknown",
          target: target ? target.name : "Unknown"
        };
      })
    };
  } else {
    // มีผู้ชนะชัดเจน
    const accusedId = mostVotedIds[0];
    const accusedPlayer = room.players.find(p => p.id === accusedId);
    const accusedIsSpy = room.gameState.spyIds.includes(accusedId);
    
    result = {
      outcome: accusedIsSpy ? "civilians-win" : "spy-wins",
      message: accusedIsSpy
        ? "The spy was caught! Civilians win!"
        : "An innocent person was accused! The spy wins!",
      spyWins: !accusedIsSpy,
      spies: room.players
        .filter(p => room.gameState.spyIds.includes(p.id))
        .map(p => p.name),
      location: room.gameState.location,
      accusedPlayer: accusedPlayer ? accusedPlayer.name : "Unknown player",
      votes: room.gameState.votes.map(v => {
        const voter = room.players.find(p => p.id === v.voterId);
        const target = room.players.find(p => p.id === v.targetId);
        return {
          voter: voter ? voter.name : "Unknown",
          target: target ? target.name : "Unknown"
        };
      })
    };
  }
  
  console.log(`Game over in room ${roomCode}. Result: ${result.outcome}`);
  console.log("Game result details:", result);
  
  // ส่งผลลัพธ์ให้ทุกคน
  io.to(roomCode).emit("gameOver", result);
  
  // รีเซ็ตสถานะเกมแต่เก็บข้อมูลห้องไว้
  room.gameState.active = false;
  
  // ตรวจสอบว่าเริ่มเกมใหม่ได้หรือไม่
  if (room.players.filter(p => p.isConnected).length >= 4) {
    io.to(roomCode).emit("canStartGame", true);
  }
}

// API route สำหรับตรวจสอบห้อง (สำหรับการพัฒนาเท่านั้น)
app.get('/api/room/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode;
  if (rooms.has(roomCode)) {
    const room = rooms.get(roomCode);
    res.json({
      roomCode,
      playersCount: room.players.length,
      isActive: room.gameState.active,
      settings: room.settings,
      playersData: room.players.map(p => ({
        name: p.name,
        isHost: p.isHost,
        isConnected: p.isConnected
      }))
    });
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

// ส่งหน้าเว็บแอป
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
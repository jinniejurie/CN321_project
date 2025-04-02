const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// รายการห้องทั้งหมด - ในตัวอย่างนี้เราเก็บในหน่วยความจำแทนการใช้ MongoDB
const rooms = new Map();

// รายการสถานที่ที่เป็นไปได้
const locations = [
  "Beach", "Restaurant", "Airport", "Bank", "School", "Casino", 
  "Hotel", "Supermarket", "Hospital", "Military Base", "Space Station", 
  "Movie Studio", "University", "Cruise Ship", "Submarine", "Theater",
  "Circus", "Cemetery", "Prison", "Police Station", "Train Station",
  "Embassy", "Amusement Park", "Museum", "Library", "Golf Course"
];

// สร้างรหัสห้องที่ไม่ซ้ำกัน (5 หลัก)
function generateRoomCode() {
  while (true) {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    if (!rooms.has(code)) {
      return code;
    }
  }
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// สำหรับการส่งหน้าเว็บแอปไปให้ไคลเอนต์
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // สร้างห้องใหม่
  socket.on("createRoom", ({ playerName }) => {
    try {
      if (!playerName || typeof playerName !== 'string') {
        return socket.emit("errorMessage", { message: "Invalid player name" });
      }

      // สร้างรหัสห้องและข้อมูลห้อง
      const roomCode = generateRoomCode();
      const newRoom = {
        code: roomCode,
        host: socket.id,
        hostName: playerName,
        players: [{ id: socket.id, name: playerName, isHost: true }],
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
          timer: null
        }
      };

      // เก็บห้องใน Map และเข้าร่วมห้อง
      rooms.set(roomCode, newRoom);
      socket.join(roomCode);

      // แจ้งผู้เล่นว่าสร้างห้องสำเร็จ
      socket.emit("roomCreated", {
        roomCode: roomCode,
        isHost: true,
        settings: newRoom.settings
      });

      // อัปเดตรายการผู้เล่น
      io.to(roomCode).emit("updatePlayers", {
        players: newRoom.players,
        host: newRoom.hostName,
        hostId: newRoom.host
      });

      console.log(`Room created: ${roomCode} by ${playerName}`);
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("errorMessage", { message: "Failed to create room" });
    }
  });

  // เข้าร่วมห้องที่มีอยู่
  socket.on("joinRoom", ({ roomCode, playerName }) => {
    try {
      if (!roomCode || !playerName || typeof roomCode !== 'string' || typeof playerName !== 'string') {
        return socket.emit("errorMessage", { message: "Invalid room code or player name" });
      }

      // ตรวจสอบว่าห้องมีอยู่
      const room = rooms.get(roomCode);
      if (!room) {
        return socket.emit("errorMessage", { message: "Room not found" });
      }

      // ตรวจสอบว่าเกมเริ่มไปแล้วหรือไม่
      if (room.gameState.active) {
        return socket.emit("errorMessage", { message: "Game already in progress" });
      }

      // ตรวจสอบว่าห้องเต็มหรือไม่
      if (room.players.length >= room.settings.maxPlayers) {
        return socket.emit("errorMessage", { message: "Room is full" });
      }

      // ตรวจสอบว่าผู้เล่นอยู่ในห้องแล้วหรือไม่
      const existingPlayerIndex = room.players.findIndex(p => p.id === socket.id);
      if (existingPlayerIndex !== -1) {
        // ผู้เล่นอยู่ในห้องแล้ว - อาจเป็นการรีโหลดหรือรีคอนเน็กต์
        socket.join(roomCode);
        socket.emit("roomJoined", {
          roomCode,
          playerName: room.players[existingPlayerIndex].name,
          isHost: room.players[existingPlayerIndex].isHost,
          settings: room.settings
        });
      } else {
        // ตรวจสอบชื่อซ้ำและทำให้ชื่อไม่ซ้ำกัน
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
          isHost: false
        });

        socket.join(roomCode);
        socket.emit("roomJoined", {
          roomCode,
          playerName: uniqueName,
          isHost: false,
          settings: room.settings
        });
      }

      // อัปเดตรายการผู้เล่น
      io.to(roomCode).emit("updatePlayers", {
        players: room.players,
        host: room.hostName,
        hostId: room.host
      });

      // แจ้งว่ามีผู้เล่นพอที่จะเริ่มเกมได้หรือไม่
      if (room.players.length >= 4) {
        io.to(roomCode).emit("canStartGame", true);
      }

      console.log(`Player ${playerName} joined room ${roomCode}`);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("errorMessage", { message: "Failed to join room" });
    }
  });

  // อัปเดตการตั้งค่าห้อง (สำหรับโฮสต์เท่านั้น)
  socket.on("updateSettings", ({ roomCode, settings }) => {
    try {
      const room = rooms.get(roomCode);
      if (!room) {
        return socket.emit("errorMessage", { message: "Room not found" });
      }

      // ตรวจสอบว่าเป็นโฮสต์หรือไม่
      if (socket.id !== room.host) {
        return socket.emit("errorMessage", { message: "Only the host can update settings" });
      }

      // อัปเดตการตั้งค่า
      room.settings = {
        ...room.settings,
        ...settings
      };

      // แจ้งผู้เล่นทุกคนเกี่ยวกับการตั้งค่าที่อัปเดต
      io.to(roomCode).emit("settingsUpdated", room.settings);
      console.log(`Settings updated for room ${roomCode}`);
    } catch (error) {
      console.error("Error updating settings:", error);
      socket.emit("errorMessage", { message: "Failed to update settings" });
    }
  });

  // เริ่มเกม (สำหรับโฮสต์เท่านั้น)
  socket.on("startGame", ({ roomCode }) => {
    try {
      const room = rooms.get(roomCode);
      if (!room) {
        return socket.emit("errorMessage", { message: "Room not found" });
      }

      // ตรวจสอบว่าเป็นโฮสต์หรือไม่
      if (socket.id !== room.host) {
        return socket.emit("errorMessage", { message: "Only the host can start the game" });
      }

      // ตรวจสอบว่ามีผู้เล่นพอหรือไม่
      if (room.players.length < 4) {
        return socket.emit("errorMessage", { message: "Need at least 4 players to start" });
      }

      // เลือกสถานที่แบบสุ่ม
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];

      // เลือกสปายแบบสุ่ม
      const playerIds = room.players.map(p => p.id);
      const spyIds = [];

      // สุ่มเลือกจำนวนสปายตามการตั้งค่า
      for (let i = 0; i < room.settings.spiesCount; i++) {
        if (playerIds.length > spyIds.length) {
          let randomIndex;
          do {
            randomIndex = Math.floor(Math.random() * playerIds.length);
          } while (spyIds.includes(playerIds[randomIndex]));

          spyIds.push(playerIds[randomIndex]);
        }
      }

      // อัปเดตสถานะเกม
      room.gameState = {
        active: true,
        location: randomLocation,
        spyIds: spyIds,
        startTime: Date.now(),
        endTime: Date.now() + (room.settings.gameTimeInMinutes * 60 * 1000),
        votes: []
      };

      // ส่งข้อมูลเกมให้ผู้เล่นแต่ละคน
      room.players.forEach((player) => {
        const isSpy = spyIds.includes(player.id);
        io.to(player.id).emit("gameStarted", {
          role: isSpy ? "Spy" : "Civilian",
          location: isSpy ? "Unknown" : randomLocation,
          allLocations: locations,
          timer: room.settings.gameTimeInMinutes * 60
        });
      });

      // เริ่มตัวจับเวลา
      const timerDuration = room.settings.gameTimeInMinutes * 60;
      io.to(roomCode).emit("startTimer", timerDuration);

      console.log(`Game started in room ${roomCode}. Location: ${randomLocation}`);

      // ตั้งเวลาสำหรับเกม
      let timeRemaining = timerDuration;
      room.gameState.timer = setInterval(() => {
        if (timeRemaining > 0) {
          timeRemaining--;
          io.to(roomCode).emit("updateTimer", timeRemaining);
        } else {
          clearInterval(room.gameState.timer);
          io.to(roomCode).emit("startVoting");
        }
      }, 1000);
    } catch (error) {
      console.error("Error starting game:", error);
      socket.emit("errorMessage", { message: "Failed to start game" });
    }
  });

  // ส่งข้อความแชท
  socket.on("sendMessage", ({ roomCode, message }) => {
    try {
      const room = rooms.get(roomCode);
      if (!room) return;

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

  // โหวต
  socket.on("castVote", ({ roomCode, targetId }) => {
    try {
      const room = rooms.get(roomCode);
      if (!room || !room.gameState.active) return;

      // ตรวจสอบว่าผู้เล่นได้โหวตไปแล้วหรือไม่
      const existingVoteIndex = room.gameState.votes.findIndex(v => v.voterId === socket.id);

      if (existingVoteIndex !== -1) {
        // อัปเดตการโหวตที่มีอยู่
        room.gameState.votes[existingVoteIndex].targetId = targetId;
      } else {
        // เพิ่มการโหวตใหม่
        room.gameState.votes.push({
          voterId: socket.id,
          targetId
        });
      }

      // หาชื่อผู้โหวต
      const voter = room.players.find(p => p.id === socket.id);

      // แจ้งห้องว่ามีการโหวต (แต่ไม่บอกว่าโหวตให้ใคร)
      io.to(roomCode).emit("playerVoted", {
        voterId: socket.id,
        voterName: voter ? voter.name : "Unknown player"
      });

      // ตรวจสอบว่าทุกคนโหวตหรือยัง
      if (room.gameState.votes.length === room.players.length) {
        endGameWithVotes(roomCode);
      }
    } catch (error) {
      console.error("Error casting vote:", error);
    }
  });

  // ออกจากห้อง
  socket.on("leaveRoom", ({ roomCode }) => {
    try {
      leaveRoomHandler(socket, roomCode);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  });

  // จัดการการตัดการเชื่อมต่อ
  socket.on("disconnect", () => {
    try {
      console.log(`User disconnected: ${socket.id}`);
      
      // ตรวจสอบทุกห้องที่ผู้เล่นอาจอยู่
      for (const [roomCode, room] of rooms.entries()) {
        if (room.players.some(p => p.id === socket.id)) {
          leaveRoomHandler(socket, roomCode);
        }
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
});

// ฟังก์ชันช่วยจัดการการออกจากห้อง
function leaveRoomHandler(socket, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  // หาผู้เล่นในห้อง
  const playerIndex = room.players.findIndex(p => p.id === socket.id);
  if (playerIndex === -1) return;

  const player = room.players[playerIndex];
  console.log(`Player ${player.name} left room ${roomCode}`);

  // ถ้าเกมกำลังเล่นอยู่ ให้ทำเครื่องหมายว่าผู้เล่นตัดการเชื่อมต่อ แต่ไม่ลบออก
  if (room.gameState.active) {
    io.to(roomCode).emit("playerDisconnected", {
      playerId: socket.id,
      playerName: player.name
    });
    return;
  }

  // ลบผู้เล่นออกจากห้อง
  room.players.splice(playerIndex, 1);
  socket.leave(roomCode);

  // ถ้าเป็นโฮสต์ที่ออก ให้เลือกโฮสต์ใหม่
  if (player.isHost && room.players.length > 0) {
    const newHost = room.players[0];
    room.host = newHost.id;
    room.hostName = newHost.name;
    newHost.isHost = true;

    // แจ้งโฮสต์ใหม่
    io.to(newHost.id).emit("becameHost");
  }

  // ถ้าไม่มีผู้เล่นเหลือ ให้ลบห้อง
  if (room.players.length === 0) {
    if (room.gameState.timer) {
      clearInterval(room.gameState.timer);
    }
    rooms.delete(roomCode);
    console.log(`Room ${roomCode} deleted (no players left)`);
  } else {
    // อัปเดตรายการผู้เล่น
    io.to(roomCode).emit("updatePlayers", {
      players: room.players,
      host: room.hostName,
      hostId: room.host
    });

    // อัปเดตความสามารถในการเริ่มเกม
    io.to(roomCode).emit("canStartGame", room.players.length >= 4);
  }
}

// จบเกมและคำนวณผลลัพธ์
function endGameWithVotes(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || !room.gameState.active) return;

  // หยุดตัวจับเวลา
  if (room.gameState.timer) {
    clearInterval(room.gameState.timer);
    room.gameState.timer = null;
  }

  // นับคะแนนโหวตสำหรับแต่ละผู้เล่น
  const voteCounts = {};
  for (const vote of room.gameState.votes) {
    voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
  }

  // หาผู้เล่นที่ถูกโหวตมากที่สุด
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
    // เสมอกัน
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

  // ส่งผลลัพธ์ให้ผู้เล่นทุกคน
  io.to(roomCode).emit("gameOver", result);

  // รีเซ็ตสถานะเกมแต่เก็บห้องไว้
  room.gameState = {
    active: false,
    location: null,
    spyIds: [],
    votes: [],
    timer: null
  };

  console.log(`Game over in room ${roomCode}. Result: ${result.outcome}`);
}

// เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
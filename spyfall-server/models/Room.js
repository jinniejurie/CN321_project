// models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true
  },
  host: {
    type: String,
    required: true
  },
  hostName: String,
  players: [{
    id: String,
    name: String,
    isHost: Boolean,
    isConnected: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    gameTimeInMinutes: {
      type: Number,
      default: 5
    },
    spiesCount: {
      type: Number,
      default: 1
    },
    maxPlayers: {
      type: Number,
      default: 8
    }
  },
  gameState: {
    active: {
      type: Boolean,
      default: false
    },
    location: String,
    spyIds: [String],
    startTime: Date,
    endTime: Date,
    votes: [{
      voterId: String,
      targetId: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7200 // ลบห้องอัตโนมัติหลังจาก 2 ชั่วโมง
  }
});

module.exports = mongoose.model('Room', RoomSchema);
// models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 5
  },
  host: {
    type: String,
    required: true
  },
  hostId: {
    type: String,
    required: true
  },
  players: [{
    id: String,
    name: String,
    isConnected: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    maxPlayers: {
      type: Number,
      default: 8,
      min: 4,
      max: 12
    },
    gameTimeInMinutes: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    spiesCount: {
      type: Number,
      default: 1,
      min: 1,
      max: 3
    }
  },
  gameState: {
    isActive: {
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
    expires: 86400 // Room documents expire after 24 hours
  }
});

// Model for custom locations
const LocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Room = mongoose.model('Room', RoomSchema);
const Location = mongoose.model('Location', LocationSchema);

module.exports = { Room, Location };
// VoteUI.jsx
import React, { useState } from "react";
import "../styles/Vote.css";

const VoteUI = ({ players, currentPlayer, onSubmitVote }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleVote = () => {
    if (selectedPlayer) {
      onSubmitVote(selectedPlayer);
    }
  };

  return (
    <div className="vote-container">
      <h2 className="vote-title">Time's Up! Vote for the Spy</h2>
      <div className="vote-description">
        <p>Choose who you think is the spy:</p>
      </div>

      <div className="vote-options">
        {players
          .filter((player) => player.name !== currentPlayer)
          .map((player, index) => (
            <div
              key={index}
              className={`vote-option ${selectedPlayer === player.name ? 'selected' : ''}`}
              onClick={() => setSelectedPlayer(player.name)}
            >
              <div className="vote-avatar"></div>
              <span>{player.name}</span>
            </div>
          ))}
      </div>

      <button 
        className={`vote-button ${!selectedPlayer ? 'disabled' : ''}`}
        onClick={handleVote}
        disabled={!selectedPlayer}
      >
        Submit Vote
      </button>
    </div>
  );
};

export default VoteUI;
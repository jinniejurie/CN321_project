import React from "react";
import "../styles/Voting.css";

const VotingUI = ({ 
  players, 
  castVote, 
  votedPlayers, 
  currentPlayerId, 
  hasVoted,
  roomCode
}) => {
  return (
    <div className="voting-page">
      <div className="voting-container">
        <h2>Who is the Spy?</h2>
        <p className="room-code">Room: {roomCode}</p>
        
        <p className="voting-instruction">
          Cast your vote for the player you believe is the spy.
        </p>
        
        <div className="players-grid">
          {players.map((player) => (
            <div 
              key={player.id} 
              className={`player-card ${player.id === currentPlayerId ? 'self' : ''} ${hasVoted ? 'disabled' : ''}`}
              onClick={() => player.id !== currentPlayerId && !hasVoted && castVote(player.id)}
            >
              <div className="player-avatar"></div>
              <div className="player-name">{player.name}</div>
              {player.id === currentPlayerId && <div className="self-tag">You</div>}
              {votedPlayers.includes(player.id) && (
                <div className="voted-badge">Voted</div>
              )}
            </div>
          ))}
        </div>
        
        <div className="voting-status">
          <p>
            {hasVoted 
              ? "You have cast your vote. Waiting for other players..." 
              : "Please select a player to vote for."}
          </p>
          <div className="voting-progress">
            <div className="progress-text">
              {votedPlayers.length} of {players.length} players have voted
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${(votedPlayers.length / players.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingUI;
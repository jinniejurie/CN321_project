import React, { useState } from "react";
import "../styles/GameResult.css";

const GameResultUI = ({ result, returnToLobby, roomCode }) => {
  const { outcome, message, spyWins, spies, location, accusedPlayer, votes } = result;
  const [showVotes, setShowVotes] = useState(false);

  return (
    <div className="result-page">
      <div className="result-container">
        <div className={`result-banner ${spyWins ? 'spy-wins' : 'civilians-win'}`}>
          <h2>{spyWins ? "The Spy Wins!" : "The Civilians Win!"}</h2>
          <p className="room-code">Room: {roomCode}</p>
        </div>

        <div className="result-details">
          <p className="result-message">{message}</p>
          
          <div className="result-info">
            <div className="info-item">
              <h3>The {spies.length > 1 ? 'Spies' : 'Spy'}</h3>
              <div className="spy-list">
                {spies.map((spy, index) => (
                  <p key={index}>{spy}</p>
                ))}
              </div>
            </div>
            
            <div className="info-item">
              <h3>The Location</h3>
              <p>{location}</p>
            </div>
            
            {accusedPlayer && (
              <div className="info-item">
                <h3>Accused Player</h3>
                <p>{accusedPlayer}</p>
              </div>
            )}
          </div>
          
          {votes && votes.length > 0 && (
            <div className="votes-section">
              <button 
                className="toggle-votes-button"
                onClick={() => setShowVotes(!showVotes)}
              >
                {showVotes ? "Hide Voting Results" : "Show Voting Results"}
              </button>
              
              {showVotes && (
                <div className="votes-list">
                  <h3>Voting Results</h3>
                  <table className="votes-table">
                    <thead>
                      <tr>
                        <th>Voter</th>
                        <th>Voted For</th>
                      </tr>
                    </thead>
                    <tbody>
                      {votes.map((vote, index) => (
                        <tr key={index}>
                          <td>{vote.voter}</td>
                          <td>{vote.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          <button className="return-button" onClick={returnToLobby}>
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResultUI;
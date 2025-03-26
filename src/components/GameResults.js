// src/components/GameResults.js
import React from 'react';
import Hand from './Hand';
import './GameResults.css';

const GameResults = ({ results, players, hands, currentUser }) => {
  if (!results || !players || !hands) {
    return (
      <div className="loading-results">
        Calculating results...
      </div>
    );
  }
  
  // Winner is the first player in the results array
  const winnerId = results[0]?.playerId;
  const isCurrentUserWinner = winnerId === currentUser?.uid;
  
  return (
    <div className="game-results">
      <h3>Game Completed</h3>
      
      <div className="winner-announcement">
        <div className="winner-header">
          <div className="trophy-icon">🏆</div>
          <h4>Winner: {players[winnerId]?.displayName}</h4>
          {isCurrentUserWinner && <div className="you-won">You Won!</div>}
        </div>
        <div className="winner-hand">
          <p>Winning hand: {results[0]?.handName}</p>
          <Hand cards={hands[winnerId]} />
        </div>
      </div>
      
      <div className="all-results">
        <h4>Final Rankings</h4>
        <table className="results-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Hand</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => {
              const isCurrentUser = result.playerId === currentUser?.uid;
              
              return (
                <tr 
                  key={result.playerId}
                  className={`${index === 0 ? 'winner-row' : ''} ${isCurrentUser ? 'current-user-row' : ''}`}
                >
                  <td>{index + 1}</td>
                  <td>
                    {players[result.playerId]?.displayName}
                    {isCurrentUser && ' (You)'}
                  </td>
                  <td>{result.handName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="your-final-hand">
        <h4>Your Final Hand</h4>
        <Hand cards={hands[currentUser?.uid]} />
      </div>
      
      <div className="all-hands">
        <h4>All Hands</h4>
        {results.map((result, index) => (
          <div className="player-final-hand" key={result.playerId}>
            <h5>
              {players[result.playerId]?.displayName}
              {result.playerId === currentUser?.uid && ' (You)'}
              {index === 0 && ' 🏆'}
            </h5>
            <p>{result.handName}</p>
            <Hand cards={hands[result.playerId]} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameResults;

// src/components/GameResults.css

// src/components/PlayerTurn.js
import React from 'react';
import './PlayerTurn.css';

const PlayerTurn = ({ players, playerOrder, currentTurn, currentUser }) => {
  if (!players || !playerOrder || !currentTurn) {
    return null;
  }
  
  const currentTurnIndex = playerOrder.indexOf(currentTurn);
  
  return (
    <div className="player-turn">
      <h3>Player Turn</h3>
      <div className="turn-tracker">
        {playerOrder.map((playerId, index) => {
          const player = players[playerId];
          const isCurrentTurn = playerId === currentTurn;
          const isCurrentUser = playerId === currentUser?.uid;
          
          return (
            <div 
              key={playerId}
              className={`player-indicator ${isCurrentTurn ? 'current-turn' : ''} ${isCurrentUser ? 'current-user' : ''} ${player.hasExchanged ? 'exchanged' : ''}`}
            >
              <div className="player-number">{index + 1}</div>
              <div className="player-name">
                {player.displayName} 
                {isCurrentUser && ' (You)'}
                {player.hasExchanged && ' ✓'}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="turn-message">
        {currentTurn === currentUser?.uid ? (
          <p>It's your turn!</p>
        ) : (
          <p>Waiting for {players[currentTurn]?.displayName} to make a move...</p>
        )}
      </div>
    </div>
  );
};

export default PlayerTurn;
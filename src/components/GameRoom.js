import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Hand from './Hand';
import PlayerTurn from './PlayerTurn';
import ExchangeCards from './ExchangeCards';
import GameResults from './GameResults';
import { 
  getGameById, 
  startGame as startGameService, 
  exchangePlayerCards 
} from '../services/gameService';
import { 
  isOnline, 
  saveGameLocally, 
  getLocalGame, 
  makeOfflineTurn 
} from '../services/offlineService';
import './GameRoom.css';

const GameRoom = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    let unsubscribe = () => {};
    
    const fetchGame = async () => {
      setLoading(true);
      
      try {
        if (networkStatus) {
          // Online: Get real-time updates from Firebase
          unsubscribe = getGameById(gameId, (gameData) => {
            if (gameData) {
              setGame(gameData);
              // Save game locally for offline access
              saveGameLocally(gameData);
            } else {
              setError('Game not found');
            }
            setLoading(false);
          });
        } else {
          // Offline: Get game from local IndexedDB
          const localGame = await getLocalGame(gameId);
          
          if (localGame) {
            setGame(localGame);
          } else {
            setError('Game not available offline');
          }
          
          setLoading(false);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchGame();
    
    return () => {
      unsubscribe();
    };
  }, [gameId, networkStatus]);
  
  const handleStartGame = async () => {
    if (!networkStatus) {
      setError('Cannot start game in offline mode');
      return;
    }
    
    try {
      setLoading(true);
      await startGameService(gameId);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const handleSelectCard = (card) => {
    setSelectedCards(prev => {
      const isAlreadySelected = prev.some(
        c => c.value === card.value && c.suit === card.suit
      );
      
      if (isAlreadySelected) {
        return prev.filter(
          c => !(c.value === card.value && c.suit === card.suit)
        );
      } else {
        return [...prev, card];
      }
    });
  };
  
  const handleExchangeCards = async () => {
    try {
      setLoading(true);
      
      const selectedIndices = selectedCards.map(selectedCard => {
        return game.hands[currentUser.uid].findIndex(
          card => card.value === selectedCard.value && card.suit === selectedCard.suit
        );
      });
      
      if (networkStatus) {
        // Online: Use Firebase
        await exchangePlayerCards(gameId, selectedIndices);
      } else {
        // Offline: Use local storage
        const updatedGame = await makeOfflineTurn(gameId, selectedIndices);
        setGame(updatedGame);
      }
      
      setSelectedCards([]);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const isGameOwner = game && game.owner === currentUser?.uid;
  const isPlayerInGame = game && game.players && game.players[currentUser?.uid];
  const isCurrentPlayerTurn = game && game.currentTurn === currentUser?.uid;
  const hasPlayerExchanged = game && game.players[currentUser?.uid]?.hasExchanged;
  const playerHand = game && game.hands && game.hands[currentUser?.uid];
  
  if (loading) {
    return <div className="loading">Loading game...</div>;
  }
  
  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={() => navigate('/games')}>
          Back to Game List
        </button>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="not-found">
        <p>Game not found</p>
        <button onClick={() => navigate('/games')}>
          Back to Game List
        </button>
      </div>
    );
  }
  
  return (
    <div className="game-room">
      <div className="game-header">
        <h2>{game.name}</h2>
        <div className={`network-status ${networkStatus ? 'online' : 'offline'}`}>
          {networkStatus ? 'Online' : 'Offline Mode'}
        </div>
      </div>
      
      {game.status === 'waiting' && (
        <div className="waiting-room">
          <h3>Waiting for Players</h3>
          <div className="player-list">
            <h4>Players:</h4>
            <ul>
              {Object.values(game.players || {}).map(player => (
                <li key={player.id}>
                  {player.displayName} {player.isOwner ? '(Owner)' : ''}
                </li>
              ))}
            </ul>
          </div>
          
          {isGameOwner && (
            <button 
              onClick={handleStartGame}
              disabled={Object.keys(game.players || {}).length < 2}
              className="start-game-btn"
            >
              Start Game
            </button>
          )}
          
          {!isGameOwner && (
            <p>Waiting for the game owner to start the game...</p>
          )}
        </div>
      )}
      
      {game.status === 'playing' && (
        <div className="game-board">
          <PlayerTurn 
            players={game.players}
            playerOrder={game.playerOrder}
            currentTurn={game.currentTurn}
            currentUser={currentUser}
          />
          
          {playerHand && (
            <div className="player-area">
              <h3>Your Hand</h3>
              <Hand 
                cards={playerHand}
                selectedCards={selectedCards}
                onSelectCard={handleSelectCard}
                canSelectCards={isCurrentPlayerTurn && !hasPlayerExchanged}
                isCurrentPlayer={isCurrentPlayerTurn}
              />
              
              <ExchangeCards 
                selectedCards={selectedCards}
                onExchange={handleExchangeCards}
                disabled={!isCurrentPlayerTurn || hasPlayerExchanged || selectedCards.length === 0}
              />
              
              {isCurrentPlayerTurn && !hasPlayerExchanged && (
                <div className="instructions">
                  <p>Select the cards you want to exchange, then click "Exchange Cards".</p>
                  <p>You can select between 0 and 5 cards.</p>
                </div>
              )}
              
              {isCurrentPlayerTurn && hasPlayerExchanged && (
                <div className="waiting">
                  <p>You have already exchanged cards. Waiting for other players.</p>
                </div>
              )}
              
              {!isCurrentPlayerTurn && (
                <div className="waiting">
                  <p>Waiting for your turn...</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {game.status === 'completed' && (
        <GameResults 
          results={game.results}
          players={game.players}
          hands={game.hands}
          currentUser={currentUser}
        />
      )}
      
      <button 
        onClick={() => navigate('/games')}
        className="back-btn"
      >
        Back to Game List
      </button>
    </div>
  );
};

export default GameRoom;
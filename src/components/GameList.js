import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { openDB } from 'idb';
import { getAvailableGames, joinGame } from '../services/gameService';
import { isOnline, getLocalGame } from '../services/offlineService';
import './GameList.css';

const GameList = () => {
  const [games, setGames] = useState([]);
  const [offlineGames, setOfflineGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningGame, setJoiningGame] = useState(false);
  const [error, setError] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  
  const navigate = useNavigate();
  
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

  // Add this effect to ensure loading state is cleared after a timeout
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (loading) {
      console.log('Force ending loading state after timeout');
      setLoading(false);
    }
  }, 5000); // 5 second timeout
  
  return () => clearTimeout(timeoutId);
}, [loading]);
  
  useEffect(() => {
    let unsubscribe = () => {};
    
    const fetchGames = async () => {
      setLoading(true);
      
      try {
        if (networkStatus) {
          // Online: Get available games from Firebase
          unsubscribe = getAvailableGames((availableGames) => {
            setGames(availableGames);
            setLoading(false);
          });
        } else {
          // Offline: Show message
          setGames([]);
          setLoading(false);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    
    
    const fetchOfflineGames = async () => {
      try {
        // Import openDB at the top of your file if not already imported
        // import { openDB } from 'idb';
        
        // Define database schema
        const dbPromise = openDB('poker-game-db', 1, {
          upgrade(db) {
            console.log('Creating object stores if needed');
            // Create stores if they don't exist
            if (!db.objectStoreNames.contains('games')) {
              db.createObjectStore('games', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('pendingActions')) {
              db.createObjectStore('pendingActions', { 
                keyPath: 'id', 
                autoIncrement: true 
              });
            }
          },
        });
        
        // Wait for database to be ready
        const db = await dbPromise;
        console.log('Database ready, fetching games');
        
        // Now safely get games
        const games = await db.getAll('games');
        console.log('Got offline games:', games);
        setOfflineGames(games || []);
      } catch (err) {
        console.error('Error fetching offline games:', err);
        setOfflineGames([]);
      }
    };
    
    fetchGames();
    fetchOfflineGames();
    
    return () => {
      unsubscribe();
    };
  }, [networkStatus]);
  
  const handleJoinGame = async (gameId) => {
    try {
      setJoiningGame(true);
      await joinGame(gameId);
      navigate(`/game/${gameId}`);
    } catch (err) {
      setError(err.message);
      setJoiningGame(false);
    }
  };
  
  const handleResumeOfflineGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };
  
  if (loading) {
    return <div className="loading">Loading games...</div>;
  }
  
  return (
    <div className="game-list">
      <h2>Available Games</h2>
      
      <div className={`network-status ${networkStatus ? 'online' : 'offline'}`}>
        {networkStatus ? 'Online' : 'Offline Mode'}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="actions">
        <Link to="/create-game" className="create-game-btn">
          Create New Game
        </Link>
      </div>
      
      {networkStatus && (
        <div className="available-games">
          <h3>Games Waiting for Players</h3>
          
          {games.length === 0 ? (
            <div className="no-games">
              <p>No games available. Create a new game!</p>
            </div>
          ) : (
            <ul className="game-list-items">
              {games.map(game => (
                <li key={game.id} className="game-item">
                  <div className="game-info">
                    <h4>{game.name}</h4>
                    <p>
                      Created by: {game.ownerDisplayName} | 
                      Players: {Object.keys(game.players || {}).length}
                    </p>
                    <p className="created-at">
                      Created: {new Date(game.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoinGame(game.id)}
                    className="join-btn"
                    disabled={joiningGame}
                  >
                    {joiningGame ? 'Joining...' : 'Join Game'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {offlineGames.length > 0 && (
        <div className="offline-games">
          <h3>Your Games</h3>
          <p className="offline-note">
            These games are available for offline play
          </p>
          
          <ul className="game-list-items">
            {offlineGames.map(game => (
              <li key={game.id} className="game-item">
                <div className="game-info">
                  <h4>{game.name}</h4>
                  <p>
                    Status: {game.status} | 
                    Players: {Object.keys(game.players || {}).length}
                  </p>
                  <p className="updated-at">
                    Last updated: {new Date(game.lastUpdated).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleResumeOfflineGame(game.id)}
                  className="resume-btn"
                >
                  {networkStatus ? 'Open' : 'Play Offline'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GameList;
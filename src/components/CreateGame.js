import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../services/gameService';
import { isOnline } from '../services/offlineService';
import './CreateGame.css';

const CreateGame = () => {
  const [gameName, setGameName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!gameName.trim()) {
      setError('Please enter a game name');
      return;
    }
    
    if (!isOnline()) {
      setError('Cannot create a game in offline mode');
      return;
    }
    
    try {
      setLoading(true);
      const game = await createGame(gameName.trim());
      navigate(`/game/${game.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  return (
    <div className="create-game">
      <h2>Create New Game</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="gameName">Game Name</label>
          <input
            type="text"
            id="gameName"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            placeholder="Enter a name for your game"
            disabled={loading}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button
          type="submit"
          className="create-btn"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Game'}
        </button>
      </form>
      
      <button
        onClick={() => navigate('/games')}
        className="back-btn"
        disabled={loading}
      >
        Back to Game List
      </button>
    </div>
  );
};

export default CreateGame;
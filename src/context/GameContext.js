// src/context/GameContext.js
import React, { createContext, useState, useContext } from 'react';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [currentGame, setCurrentGame] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);
  const [offlineGames, setOfflineGames] = useState([]);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  
  const updateNetworkStatus = (status) => {
    setNetworkStatus(status);
  };
  
  const updateCurrentGame = (game) => {
    setCurrentGame(game);
  };
  
  const updateAvailableGames = (games) => {
    setAvailableGames(games);
  };
  
  const updateOfflineGames = (games) => {
    setOfflineGames(games);
  };
  
  const value = {
    currentGame,
    availableGames,
    offlineGames,
    networkStatus,
    updateCurrentGame,
    updateAvailableGames,
    updateOfflineGames,
    updateNetworkStatus
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// src/services/offlineService.js
import { openDB } from 'idb';
import { getCurrentUser } from './authService';
import { exchangeCards, determineWinner } from './cardService';

// Initialize IndexedDB
const initDB = async () => {
  return openDB('poker-game-db', 1, {
    upgrade(db) {
      // Store for offline game data
      if (!db.objectStoreNames.contains('games')) {
        db.createObjectStore('games', { keyPath: 'id' });
      }
      
      // Store for pending actions to sync when back online
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
    },
  });
};

// Save game to IndexedDB for offline access
export const saveGameLocally = async (gameData) => {
  try {
    const db = await initDB();
    await db.put('games', gameData);
    return true;
  } catch (error) {
    console.error('Error saving game locally:', error);
    return false;
  }
};

// Get game from IndexedDB
export const getLocalGame = async (gameId) => {
  try {
    const db = await initDB();
    return await db.get('games', gameId);
  } catch (error) {
    console.error('Error getting local game:', error);
    return null;
  }
};

// Save pending action to be synced when online
export const savePendingAction = async (action) => {
  try {
    const db = await initDB();
    await db.add('pendingActions', {
      ...action,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error saving pending action:', error);
    return false;
  }
};

// Get all pending actions
export const getPendingActions = async () => {
  try {
    const db = await initDB();
    return await db.getAll('pendingActions');
  } catch (error) {
    console.error('Error getting pending actions:', error);
    return [];
  }
};

// Remove a pending action after it's been synced
export const removePendingAction = async (actionId) => {
  try {
    const db = await initDB();
    await db.delete('pendingActions', actionId);
    return true;
  } catch (error) {
    console.error('Error removing pending action:', error);
    return false;
  }
};

// Make a turn in offline mode
export const makeOfflineTurn = async (gameId, cardsToExchangeIndices) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    // Get the local game data
    const gameData = await getLocalGame(gameId);
    if (!gameData) {
      throw new Error('Game not found locally');
    }
    
    // Check if game is in playing status
    if (gameData.status !== 'playing') {
      throw new Error('Game is not in progress');
    }
    
    // Check if it's the player's turn
    if (gameData.currentTurn !== user.uid) {
      throw new Error('It is not your turn');
    }
    
    // Check if player has already exchanged cards
    if (gameData.players[user.uid].hasExchanged) {
      throw new Error('You have already exchanged cards');
    }
    
    // Exchange cards
    const { newHand, remainingDeck } = exchangeCards(
      gameData.hands[user.uid],
      cardsToExchangeIndices,
      gameData.deck
    );
    
    // Find the next player
    const currentPlayerIndex = gameData.playerOrder.indexOf(user.uid);
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameData.playerOrder.length;
    const nextPlayerId = gameData.playerOrder[nextPlayerIndex];
    
    // Check if all players have exchanged cards
    const allPlayersExchanged = Object.values(gameData.players).every(
      player => player.id === user.uid ? true : player.hasExchanged
    );
    
    // Update the local game data
    const updatedGameData = {
      ...gameData,
      hands: {
        ...gameData.hands,
        [user.uid]: newHand
      },
      deck: remainingDeck,
      players: {
        ...gameData.players,
        [user.uid]: {
          ...gameData.players[user.uid],
          hasExchanged: true
        }
      },
      currentTurn: nextPlayerId,
      lastUpdated: new Date().toISOString()
    };
    
    // If all players have exchanged cards, determine the winner
    if (allPlayersExchanged) {
      const playerHands = updatedGameData.hands;
      const hands = gameData.playerOrder.map(playerId => playerHands[playerId]);
      const results = determineWinner(hands);
      
      updatedGameData.status = 'completed';
      updatedGameData.results = results.map(result => ({
        playerId: gameData.playerOrder[result.playerId],
        handRank: result.evaluation.rank,
        handName: result.evaluation.name
      }));
    }
    
    // Save the updated game locally
    await saveGameLocally(updatedGameData);
    
    // Save the action to be synced when back online
    await savePendingAction({
      type: 'EXCHANGE_CARDS',
      gameId,
      userId: user.uid,
      cardsToExchangeIndices,
      timestamp: new Date().toISOString()
    });
    
    return updatedGameData;
  } catch (error) {
    console.error('Error making offline turn:', error);
    throw error;
  }
};

// Check online status
export const isOnline = () => {
  return navigator.onLine;
};

// Sync pending actions when back online
export const syncPendingActions = async () => {
  if (!isOnline()) return false;
  
  try {
    const pendingActions = await getPendingActions();
    
    if (pendingActions.length === 0) return true;
    
    // Sort actions by timestamp
    pendingActions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Process each action
    for (const action of pendingActions) {
      try {
        if (action.type === 'EXCHANGE_CARDS') {
          // Import the online function to sync
          const { exchangePlayerCards } = await import('./gameService');
          await exchangePlayerCards(action.gameId, action.cardsToExchangeIndices);
        }
        
        // Remove the action after successful sync
        await removePendingAction(action.id);
      } catch (error) {
        console.error(`Error syncing action ${action.id}:`, error);
        // Continue with other actions
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing pending actions:', error);
    return false;
  }
};

// Add event listeners for online/offline events
export const setupNetworkListeners = () => {
  window.addEventListener('online', () => {
    console.log('Back online, syncing pending actions...');
    syncPendingActions();
  });
  
  window.addEventListener('offline', () => {
    console.log('Offline mode active');
  });
};

// Utility to check if a game can be played offline
export const canPlayOffline = async (gameId) => {
  const gameData = await getLocalGame(gameId);
  
  if (!gameData) {
    return false;
  }
  
  const user = getCurrentUser();
  if (!user) {
    return false;
  }
  
  // Check if the user is part of the game
  return gameData.players && gameData.players[user.uid];
};

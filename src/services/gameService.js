// src/services/gameService.js
import { 
  ref, set, push, get, update, onValue, remove 
} from 'firebase/database';
import { database } from './firebase';
import { getCurrentUser } from './authService';
import { 
  createDeck, shuffleDeck, dealCards, exchangeCards, determineWinner 
} from './cardService';

// Create a new game
export const createGame = async (gameName) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const newGameRef = push(ref(database, 'games'));
    
    // Create and shuffle the deck
    const deck = shuffleDeck(createDeck());
    
    const gameData = {
      id: newGameRef.key,
      name: gameName,
      owner: user.uid,
      ownerDisplayName: user.displayName || 'Anonymous',
      status: 'waiting', // waiting, playing, completed
      players: {
        [user.uid]: {
          id: user.uid,
          displayName: user.displayName || 'Anonymous',
          isOwner: true,
          hasExchanged: false
        }
      },
      playerOrder: [user.uid],
      currentTurn: null,
      deck: deck,
      hands: {},
      exchangedCards: {},
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    await set(newGameRef, gameData);
    return gameData;
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
};

// Join an existing game
export const joinGame = async (gameId) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = snapshot.val();
    
    // Check if game is waiting for players
    if (gameData.status !== 'waiting') {
      throw new Error('Game has already started');
    }
    
    // Check if player is already in the game
    if (gameData.players && gameData.players[user.uid]) {
      return gameData;
    }
    
    // Add player to the game
    const updates = {};
    updates[`games/${gameId}/players/${user.uid}`] = {
      id: user.uid,
      displayName: user.displayName || 'Anonymous',
      isOwner: false,
      hasExchanged: false
    };
    
    // Add player to playerOrder
    const updatedPlayerOrder = [...(gameData.playerOrder || []), user.uid];
    updates[`games/${gameId}/playerOrder`] = updatedPlayerOrder;
    updates[`games/${gameId}/lastUpdated`] = new Date().toISOString();
    
    await update(ref(database), updates);
    
    return {
      ...gameData,
      players: {
        ...(gameData.players || {}),
        [user.uid]: {
          id: user.uid,
          displayName: user.displayName || 'Anonymous',
          isOwner: false,
          hasExchanged: false
        }
      },
      playerOrder: updatedPlayerOrder
    };
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
};

// Start the game
export const startGame = async (gameId) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = snapshot.val();
    
    // Verify user is the owner
    if (gameData.owner !== user.uid) {
      throw new Error('Only the game owner can start the game');
    }
    
    // Check if game is still in waiting status
    if (gameData.status !== 'waiting') {
      throw new Error('Game has already started');
    }
    
    // Check if there are at least 2 players
    const playerCount = Object.keys(gameData.players || {}).length;
    if (playerCount < 2) {
      throw new Error('At least 2 players are required to start the game');
    }
    
    // Deal cards to players
    const playerOrder = gameData.playerOrder;
    const { hands, remainingDeck } = dealCards(gameData.deck, playerCount);
    
    const playerHands = {};
    playerOrder.forEach((playerId, index) => {
      playerHands[playerId] = hands[index];
    });
    
    // Update game state
    const updates = {};
    updates[`games/${gameId}/status`] = 'playing';
    updates[`games/${gameId}/hands`] = playerHands;
    updates[`games/${gameId}/deck`] = remainingDeck;
    updates[`games/${gameId}/currentTurn`] = playerOrder[0];
    updates[`games/${gameId}/lastUpdated`] = new Date().toISOString();
    
    await update(ref(database), updates);
    
    return {
      ...gameData,
      status: 'playing',
      hands: playerHands,
      deck: remainingDeck,
      currentTurn: playerOrder[0]
    };
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;
  }
};

// Exchange cards
export const exchangePlayerCards = async (gameId, cardsToExchangeIndices) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = snapshot.val();
    
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
    
    // Update game state
    const updates = {};
    updates[`games/${gameId}/hands/${user.uid}`] = newHand;
    updates[`games/${gameId}/deck`] = remainingDeck;
    updates[`games/${gameId}/players/${user.uid}/hasExchanged`] = true;
    updates[`games/${gameId}/currentTurn`] = nextPlayerId;
    updates[`games/${gameId}/lastUpdated`] = new Date().toISOString();
    
    // If all players have exchanged cards, determine the winner
    if (allPlayersExchanged) {
      const playerHands = {
        ...gameData.hands,
        [user.uid]: newHand
      };
      
      const hands = gameData.playerOrder.map(playerId => playerHands[playerId]);
      const results = determineWinner(hands);
      
      updates[`games/${gameId}/status`] = 'completed';
      updates[`games/${gameId}/results`] = results.map(result => ({
        playerId: gameData.playerOrder[result.playerId],
        handRank: result.evaluation.rank,
        handName: result.evaluation.name
      }));
    }
    
    await update(ref(database), updates);
    
    return {
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
      ...(allPlayersExchanged ? {
        status: 'completed',
        results: updates[`games/${gameId}/results`]
      } : {})
    };
  } catch (error) {
    console.error("Error exchanging cards:", error);
    throw error;
  }
};

// Get available games (waiting for players)
export const getAvailableGames = (callback) => {
  const gamesRef = ref(database, 'games');
  
  return onValue(gamesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const gamesData = snapshot.val();
    const availableGames = Object.values(gamesData)
      .filter(game => game.status === 'waiting')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    callback(availableGames);
  });
};

// Get a specific game by ID
export const getGameById = (gameId, callback) => {
  const gameRef = ref(database, `games/${gameId}`);
  
  return onValue(gameRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    callback(snapshot.val());
  });
};

// Leave a game
export const leaveGame = async (gameId) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = snapshot.val();
    
    // Check if game is still in waiting status
    if (gameData.status !== 'waiting') {
      throw new Error('Cannot leave a game that has already started');
    }
    
    // If user is the owner, delete the game
    if (gameData.owner === user.uid) {
      await remove(gameRef);
      return null;
    }
    
    // Remove player from the game
    const updates = {};
    updates[`games/${gameId}/players/${user.uid}`] = null;
    
    // Update player order
    const updatedPlayerOrder = gameData.playerOrder.filter(id => id !== user.uid);
    updates[`games/${gameId}/playerOrder`] = updatedPlayerOrder;
    updates[`games/${gameId}/lastUpdated`] = new Date().toISOString();
    
    await update(ref(database), updates);
    
    return {
      ...gameData,
      players: Object.entries(gameData.players)
        .filter(([id]) => id !== user.uid)
        .reduce((acc, [id, player]) => ({ ...acc, [id]: player }), {}),
      playerOrder: updatedPlayerOrder
    };
  } catch (error) {
    console.error("Error leaving game:", error);
    throw error;
  }
};

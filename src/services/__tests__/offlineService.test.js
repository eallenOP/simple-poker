// src/services/__tests__/offlineService.test.js
import { openDB } from 'idb';
import {
  saveGameLocally,
  getLocalGame,
  savePendingAction,
  getPendingActions,
  removePendingAction,
  makeOfflineTurn,
  isOnline,
  syncPendingActions,
  setupNetworkListeners,
  canPlayOffline
} from '../offlineService';
import { getCurrentUser } from '../authService';
import { exchangeCards, determineWinner } from '../cardService';

// Mock dependencies
jest.mock('idb');
jest.mock('../authService');
jest.mock('../cardService');
jest.mock('../gameService', () => ({
  exchangePlayerCards: jest.fn()
}));

describe('Offline Service', () => {
  // Test database and store mocks
  const mockDb = {
    put: jest.fn(),
    get: jest.fn(),
    add: jest.fn(),
    getAll: jest.fn(),
    delete: jest.fn()
  };
  
  const mockOpenDB = () => {
    openDB.mockResolvedValue(mockDb);
  };
  
  // Test data
  const testGameId = 'game123';
  const testGameData = {
    id: testGameId,
    name: 'Test Game',
    status: 'playing',
    players: {
      'user1': { id: 'user1', displayName: 'Player 1', hasExchanged: false },
      'user2': { id: 'user2', displayName: 'Player 2', hasExchanged: true }
    },
    playerOrder: ['user1', 'user2'],
    currentTurn: 'user1',
    hands: {
      'user1': [{ suit: 'hearts', value: 'A' }, { suit: 'diamonds', value: 'K' }],
      'user2': [{ suit: 'clubs', value: 'Q' }, { suit: 'spades', value: 'J' }]
    },
    deck: [{ suit: 'hearts', value: '10' }, { suit: 'diamonds', value: '9' }]
  };
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenDB();
  });
  
  describe('saveGameLocally', () => {
    it('should save game data to IndexedDB', async () => {
      mockDb.put.mockResolvedValue(true);
      
      const result = await saveGameLocally(testGameData);
      
      // IndexedDB should be opened with correct parameters
      expect(openDB).toHaveBeenCalledWith('poker-game-db', 1, expect.any(Object));
      
      // Put should be called with game data
      expect(mockDb.put).toHaveBeenCalledWith('games', testGameData);
      
      // Function should return true
      expect(result).toBe(true);
    });
    
    it('should handle errors when saving game data', async () => {
      // Simulate an error
      mockDb.put.mockRejectedValue(new Error('Save failed'));
      
      const result = await saveGameLocally(testGameData);
      
      // Function should return false
      expect(result).toBe(false);
    });
  });
  
  describe('getLocalGame', () => {
    it('should retrieve game data from IndexedDB', async () => {
      // Simulate successful retrieval
      mockDb.get.mockResolvedValue(testGameData);
      
      const result = await getLocalGame(testGameId);
      
      // IndexedDB should be opened with correct parameters
      expect(openDB).toHaveBeenCalledWith('poker-game-db', 1, expect.any(Object));
      
      // Get should be called with game ID
      expect(mockDb.get).toHaveBeenCalledWith('games', testGameId);
      
      // Function should return the game data
      expect(result).toEqual(testGameData);
    });
    
    it('should handle errors when retrieving game data', async () => {
      // Simulate an error
      mockDb.get.mockRejectedValue(new Error('Get failed'));
      
      const result = await getLocalGame(testGameId);
      
      // Function should return null
      expect(result).toBeNull();
    });
  });
  
  describe('savePendingAction', () => {
    it('should save pending action to IndexedDB', async () => {
      // Test action data
      const testAction = {
        type: 'EXCHANGE_CARDS',
        gameId: testGameId,
        userId: 'user1',
        cardsToExchangeIndices: [0, 1]
      };
      
      mockDb.add.mockResolvedValue(true);
      
      const result = await savePendingAction(testAction);
      
      // IndexedDB should be opened with correct parameters
      expect(openDB).toHaveBeenCalledWith('poker-game-db', 1, expect.any(Object));
      
      // Add should be called with action data and timestamp
      expect(mockDb.add).toHaveBeenCalledWith('pendingActions', {
        ...testAction,
        timestamp: expect.any(String)
      });
      
      // Function should return true
      expect(result).toBe(true);
    });
    
    it('should handle errors when saving pending action', async () => {
      // Test action data
      const testAction = {
        type: 'EXCHANGE_CARDS',
        gameId: testGameId,
        userId: 'user1',
        cardsToExchangeIndices: [0, 1]
      };
      
      // Simulate an error
      mockDb.add.mockRejectedValue(new Error('Save failed'));
      
      const result = await savePendingAction(testAction);
      
      // Function should return false
      expect(result).toBe(false);
    });
  });
  
  describe('getPendingActions', () => {
    it('should retrieve pending actions from IndexedDB', async () => {
      // Test pending actions
      const testActions = [
        {
          id: 1,
          type: 'EXCHANGE_CARDS',
          gameId: testGameId,
          userId: 'user1',
          cardsToExchangeIndices: [0, 1],
          timestamp: '2023-01-01T00:00:00.000Z'
        }
      ];
      
      mockDb.getAll.mockResolvedValue(testActions);
      
      const result = await getPendingActions();
      
      // IndexedDB should be opened with correct parameters
      expect(openDB).toHaveBeenCalledWith('poker-game-db', 1, expect.any(Object));
      
      // GetAll should be called for pendingActions store
      expect(mockDb.getAll).toHaveBeenCalledWith('pendingActions');
      
      // Function should return the pending actions
      expect(result).toEqual(testActions);
    });
    
    it('should handle errors when retrieving pending actions', async () => {
      // Simulate an error
      mockDb.getAll.mockRejectedValue(new Error('Get failed'));
      
      const result = await getPendingActions();
      
      // Function should return an empty array
      expect(result).toEqual([]);
    });
  });
  
  describe('removePendingAction', () => {
    it('should remove a pending action from IndexedDB', async () => {
      // Test action ID
      const testActionId = 1;
      
      mockDb.delete.mockResolvedValue(true);
      
      const result = await removePendingAction(testActionId);
      
      // IndexedDB should be opened with correct parameters
      expect(openDB).toHaveBeenCalledWith('poker-game-db', 1, expect.any(Object));
      
      // Delete should be called with action ID
      expect(mockDb.delete).toHaveBeenCalledWith('pendingActions', testActionId);
      
      // Function should return true
      expect(result).toBe(true);
    });
    
    it('should handle errors when removing a pending action', async () => {
      // Test action ID
      const testActionId = 1;
      
      // Simulate an error
      mockDb.delete.mockRejectedValue(new Error('Delete failed'));
      
      const result = await removePendingAction(testActionId);
      
      // Function should return false
      expect(result).toBe(false);
    });
  });
  
  describe('makeOfflineTurn', () => {
    it('should process a turn in offline mode', async () => {
      // Setup mocks
      const testUser = { uid: 'user1' };
      getCurrentUser.mockReturnValue(testUser);
      
      mockDb.get.mockResolvedValue(testGameData);
      mockDb.put.mockResolvedValue(true);
      
      // Mock exchangeCards
      const newHand = [{ suit: 'hearts', value: '10' }, { suit: 'diamonds', value: 'K' }];
      const remainingDeck = [{ suit: 'diamonds', value: '9' }];
      exchangeCards.mockReturnValue({ newHand, remainingDeck });
      
      // Test card indices to exchange
      const cardsToExchangeIndices = [0];
      
      const result = await makeOfflineTurn(testGameId, cardsToExchangeIndices);
      
      // Should get the local game
      expect(mockDb.get).toHaveBeenCalledWith('games', testGameId);
      
      // Should exchange cards
      expect(exchangeCards).toHaveBeenCalledWith(
        testGameData.hands.user1,
        cardsToExchangeIndices,
        testGameData.deck
      );
      
      // Should update the game locally
      expect(mockDb.put).toHaveBeenCalledWith('games', expect.objectContaining({
        id: testGameId,
        hands: {
          user1: newHand,
          user2: testGameData.hands.user2
        },
        deck: remainingDeck,
        players: {
          user1: { ...testGameData.players.user1, hasExchanged: true },
          user2: testGameData.players.user2
        },
        currentTurn: 'user2' // Next player in order
      }));
      
      // Should save a pending action
      expect(mockDb.add).toHaveBeenCalledWith('pendingActions', expect.objectContaining({
        type: 'EXCHANGE_CARDS',
        gameId: testGameId,
        userId: 'user1',
        cardsToExchangeIndices
      }));
      
      // Should return the updated game
      expect(result).toEqual(expect.objectContaining({
        id: testGameId,
        hands: {
          user1: newHand,
          user2: testGameData.hands.user2
        },
        currentTurn: 'user2'
      }));
    });
    
    it('should throw an error if user is not authenticated', async () => {
      // Setup mocks to simulate unauthenticated user
      getCurrentUser.mockReturnValue(null);
      
      // Test card indices to exchange
      const cardsToExchangeIndices = [0];
      
      await expect(makeOfflineTurn(testGameId, cardsToExchangeIndices))
        .rejects.toThrow('User not authenticated');
    });
    
    it('should throw an error if game is not found locally', async () => {
      // Setup mocks
      const testUser = { uid: 'user1' };
      getCurrentUser.mockReturnValue(testUser);
      
      // Simulate game not found
      mockDb.get.mockResolvedValue(null);
      
      // Test card indices to exchange
      const cardsToExchangeIndices = [0];
      
      await expect(makeOfflineTurn(testGameId, cardsToExchangeIndices))
        .rejects.toThrow('Game not found locally');
    });
    
    it('should complete the game if all players have exchanged cards', async () => {
      // Setup mocks
      const testUser = { uid: 'user1' };
      getCurrentUser.mockReturnValue(testUser);
      
      // Game data where other player has already exchanged
      mockDb.get.mockResolvedValue(testGameData);
      mockDb.put.mockResolvedValue(true);
      
      // Mock exchangeCards
      const newHand = [{ suit: 'hearts', value: '10' }, { suit: 'diamonds', value: 'K' }];
      const remainingDeck = [{ suit: 'diamonds', value: '9' }];
      exchangeCards.mockReturnValue({ newHand, remainingDeck });
      
      // Mock determineWinner
      const results = [
        { playerId: 0, evaluation: { rank: 2, name: 'One Pair' } },
        { playerId: 1, evaluation: { rank: 1, name: 'High Card' } }
      ];
      determineWinner.mockReturnValue(results);
      
      // Test card indices to exchange
      const cardsToExchangeIndices = [0];
      
      const result = await makeOfflineTurn(testGameId, cardsToExchangeIndices);
      
      // Should update game status to completed
      expect(result.status).toBe('completed');
      
      // Should include results
      expect(result.results).toBeDefined();
    });
  });
  
  describe('isOnline', () => {
    it('should return navigator.onLine status', () => {
      // Mock navigator.onLine
      const originalOnLine = navigator.onLine;
      
      // Test online status
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      expect(isOnline()).toBe(true);
      
      // Test offline status
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      expect(isOnline()).toBe(false);
      
      // Restore original value
      Object.defineProperty(navigator, 'onLine', { value: originalOnLine, writable: true });
    });
  });
  
  describe('setupNetworkListeners', () => {
    it('should add event listeners for online and offline events', () => {
      // Spy on addEventListener
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      setupNetworkListeners();
      
      // Should add listeners for online and offline events
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
      
      // Restore original method
      addEventListenerSpy.mockRestore();
    });
  });
  
  describe('canPlayOffline', () => {
    it('should return true if game exists locally and user is part of it', async () => {
      // Setup mocks
      const testUser = { uid: 'user1' };
      getCurrentUser.mockReturnValue(testUser);
      
      // Game data with current user as a player
      mockDb.get.mockResolvedValue(testGameData);
      
      const result = await canPlayOffline(testGameId);
      
      // Should return true
      expect(result).toBe(true);
    });
    
    it('should return false if game does not exist locally', async () => {
      // Setup mocks
      const testUser = { uid: 'user1' };
      getCurrentUser.mockReturnValue(testUser);
      
      // Simulate game not found
      mockDb.get.mockResolvedValue(null);
      
      const result = await canPlayOffline(testGameId);
      
      // Should return false
      expect(result).toBe(false);
    });
    
    it('should return false if user is not authenticated', async () => {
      // Setup mocks to simulate unauthenticated user
      getCurrentUser.mockReturnValue(null);
      
      // Game data exists
      mockDb.get.mockResolvedValue(testGameData);
      
      const result = await canPlayOffline(testGameId);
      
      // Should return false
      expect(result).toBe(false);
    });
    
    it('should return false if user is not part of the game', async () => {
      // Setup mocks with a different user
      const testUser = { uid: 'user3' }; // Not in game players
      getCurrentUser.mockReturnValue(testUser);
      
      // Game data exists but user is not a player
      mockDb.get.mockResolvedValue(testGameData);
      
      const result = await canPlayOffline(testGameId);
      
      // Should return false
      expect(result).toBe(false);
    });
  });
});
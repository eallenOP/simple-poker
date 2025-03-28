// tests/e2e/gameFlow.test.js
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import App from '../../src/components/App';
import { AuthProvider } from '../../src/context/AuthContext';
import * as authService from '../../src/services/authService';
import * as gameService from '../../src/services/gameService';
import * as offlineService from '../../src/services/offlineService';

// Mock all service modules
jest.mock('../../src/services/authService');
jest.mock('../../src/services/gameService');
jest.mock('../../src/services/offlineService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(({ to }) => <div data-testid="navigate" data-to={to} />)
}));

// Mock Firebase
jest.mock('firebase/auth');
jest.mock('firebase/database');
jest.mock('../../src/services/firebase', () => ({
  app: {},
  auth: {},
  database: {}
}));

describe('End-to-End Game Flow', () => {
  // Mock user data
  const testUser = {
    uid: 'test-user-1',
    displayName: 'Test Player 1'
  };
  
  // Mock game data
  const testGameId = 'test-game-1';
  const testGame = {
    id: testGameId,
    name: 'Test Poker Game',
    owner: testUser.uid,
    ownerDisplayName: testUser.displayName,
    status: 'waiting',
    players: {
      [testUser.uid]: {
        id: testUser.uid,
        displayName: testUser.displayName,
        isOwner: true,
        hasExchanged: false
      }
    },
    playerOrder: [testUser.uid],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  // Mock available games
  const mockAvailableGames = [testGame];
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock auth service
    authService.getCurrentUser.mockReturnValue(testUser);
    authService.subscribeToAuthChanges.mockImplementation(callback => {
      callback(testUser);
      return jest.fn(); // return unsubscribe function
    });
    
    // Mock game service
    gameService.getAvailableGames.mockImplementation(callback => {
      callback(mockAvailableGames);
      return jest.fn(); // return unsubscribe function
    });
    
    gameService.getGameById.mockImplementation((gameId, callback) => {
      callback(testGame);
      return jest.fn(); // return unsubscribe function
    });
    
    gameService.createGame.mockResolvedValue(testGame);
    gameService.joinGame.mockResolvedValue(testGame);
    gameService.startGame.mockResolvedValue({
      ...testGame,
      status: 'playing',
      hands: {
        [testUser.uid]: [
          { suit: 'hearts', value: 'A', id: 'A_of_hearts' },
          { suit: 'diamonds', value: 'K', id: 'K_of_diamonds' },
          { suit: 'clubs', value: 'Q', id: 'Q_of_clubs' },
          { suit: 'spades', value: 'J', id: 'J_of_spades' },
          { suit: 'hearts', value: '10', id: '10_of_hearts' }
        ]
      },
      currentTurn: testUser.uid
    });
    
    gameService.exchangePlayerCards.mockResolvedValue({
      ...testGame,
      status: 'completed',
      hands: {
        [testUser.uid]: [
          { suit: 'hearts', value: 'A', id: 'A_of_hearts' },
          { suit: 'diamonds', value: 'K', id: 'K_of_diamonds' },
          { suit: 'clubs', value: 'Q', id: 'Q_of_clubs' },
          { suit: 'clubs', value: 'K', id: 'K_of_clubs' },
          { suit: 'clubs', value: 'A', id: 'A_of_clubs' }
        ]
      },
      results: [
        {
          playerId: testUser.uid,
          handRank: 6,
          handName: 'Flush'
        }
      ],
      players: {
        [testUser.uid]: {
          id: testUser.uid,
          displayName: testUser.displayName,
          isOwner: true,
          hasExchanged: true
        }
      }
    });
    
    // Mock offline service
    offlineService.isOnline.mockReturnValue(true);
    offlineService.setupNetworkListeners.mockImplementation(() => {});
    offlineService.saveGameLocally.mockResolvedValue(true);
  });
  
  test('Complete game flow - from login to game completion', async () => {
    render(
      <MemoryRouter initialEntries={['/games']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for the app to render with auth check
    await waitFor(() => {
      expect(authService.subscribeToAuthChanges).toHaveBeenCalled();
    });
    
    // Step 1: Landing on the Game List page
    await waitFor(() => {
      expect(screen.getByText('Available Games')).toBeInTheDocument();
    });
    
    // Check if our test game is in the list
    expect(screen.getByText('Test Poker Game')).toBeInTheDocument();
    
    // Step 2: Create a new game
    fireEvent.click(screen.getByText('Create New Game'));
    
    // Should now be on the Create Game page
    await waitFor(() => {
      expect(screen.getByText('Create New Game')).toBeInTheDocument();
    });
    
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Enter a name for your game'), {
      target: { value: 'My New Poker Game' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Game'));
    
    // Step 3: Wait for game creation and navigate to game room
    await waitFor(() => {
      expect(gameService.createGame).toHaveBeenCalledWith('My New Poker Game');
    });
    
    // Step 4: In the Game Room, waiting for players
    await waitFor(() => {
      expect(screen.getByText('Waiting for Players')).toBeInTheDocument();
    });
    
    // Since we're the owner, we should see the Start Game button
    expect(screen.getByText('Start Game')).toBeInTheDocument();
    
    // Update the mock for getGameById to simulate a second player joining
    const twoPlayerGame = {
      ...testGame,
      players: {
        ...testGame.players,
        'test-user-2': {
          id: 'test-user-2',
          displayName: 'Test Player 2',
          isOwner: false,
          hasExchanged: false
        }
      },
      playerOrder: [testUser.uid, 'test-user-2']
    };
    
    gameService.getGameById.mockImplementation((gameId, callback) => {
      callback(twoPlayerGame);
      return jest.fn();
    });
    
    // Re-render to get the updated game state
    await waitFor(() => {
      expect(screen.getByText('Test Player 2')).toBeInTheDocument();
    });
    
    // Step 5: Start the game
    fireEvent.click(screen.getByText('Start Game'));
    
    await waitFor(() => {
      expect(gameService.startGame).toHaveBeenCalledWith(testGameId);
    });
    
    // Update mock for getGameById to return a started game with hands
    const startedGame = {
      ...twoPlayerGame,
      status: 'playing',
      currentTurn: testUser.uid,
      hands: {
        [testUser.uid]: [
          { suit: 'hearts', value: 'A', id: 'A_of_hearts' },
          { suit: 'diamonds', value: 'K', id: 'K_of_diamonds' },
          { suit: 'clubs', value: 'Q', id: 'Q_of_clubs' },
          { suit: 'spades', value: 'J', id: 'J_of_spades' },
          { suit: 'hearts', value: '10', id: '10_of_hearts' }
        ]
      }
    };
    
    gameService.getGameById.mockImplementation((gameId, callback) => {
      callback(startedGame);
      return jest.fn();
    });
    
    // Step 6: Game is now playing
    await waitFor(() => {
      // Should see the "Your Hand" section
      expect(screen.getByText('Your Hand')).toBeInTheDocument();
      // Should see the "It's your turn!" message
      expect(screen.getByText("It's your turn!")).toBeInTheDocument();
    });
    
    // Should see cards in the hand
    expect(screen.getAllByTestId('mock-card')).toHaveLength(5);
    
    // Step 7: Select cards to exchange
    const cards = screen.getAllByTestId('mock-card');
    
    // Select the first and third cards
    fireEvent.click(cards[0]); // A of hearts
    fireEvent.click(cards[2]); // Q of clubs
    
    // Should see the selected cards count
    expect(screen.getByText('Selected cards: 2 / 5')).toBeInTheDocument();
    
    // Step 8: Exchange cards
    fireEvent.click(screen.getByText('Exchange Cards'));
    
    await waitFor(() => {
      expect(gameService.exchangePlayerCards).toHaveBeenCalledWith(testGameId, [0, 2]);
    });
    
    // Update mock for getGameById to return a completed game
    const completedGame = {
      ...startedGame,
      status: 'completed',
      hands: {
        [testUser.uid]: [
          { suit: 'hearts', value: 'A', id: 'A_of_hearts' },
          { suit: 'diamonds', value: 'K', id: 'K_of_diamonds' },
          { suit: 'clubs', value: 'Q', id: 'Q_of_clubs' },
          { suit: 'clubs', value: 'K', id: 'K_of_clubs' },
          { suit: 'clubs', value: 'A', id: 'A_of_clubs' }
        ],
        'test-user-2': [
          { suit: 'spades', value: '10', id: '10_of_spades' },
          { suit: 'diamonds', value: '9', id: '9_of_diamonds' },
          { suit: 'hearts', value: '8', id: '8_of_hearts' },
          { suit: 'clubs', value: '7', id: '7_of_clubs' },
          { suit: 'spades', value: '6', id: '6_of_spades' }
        ]
      },
      players: {
        ...startedGame.players,
        [testUser.uid]: {
          ...startedGame.players[testUser.uid],
          hasExchanged: true
        },
        'test-user-2': {
          ...startedGame.players['test-user-2'],
          hasExchanged: true
        }
      },
      results: [
        {
          playerId: testUser.uid,
          handRank: 6,
          handName: 'Flush'
        },
        {
          playerId: 'test-user-2',
          handRank: 1,
          handName: 'High Card'
        }
      ]
    };
    
    gameService.getGameById.mockImplementation((gameId, callback) => {
      callback(completedGame);
      return jest.fn();
    });
    
    // Step 9: Game is completed, should see results
    await waitFor(() => {
      expect(screen.getByText('Game Completed')).toBeInTheDocument();
    });
    
    // Should see the winner announcement
    expect(screen.getByText('Winner: Test Player 1')).toBeInTheDocument();
    expect(screen.getByText('You Won!')).toBeInTheDocument();
    
    // Should see the winning hand
    expect(screen.getByText('Winning hand: Flush')).toBeInTheDocument();
    
    // Should see the final rankings
    expect(screen.getByText('Final Rankings')).toBeInTheDocument();
    
    // Should see both players in the rankings
    const rankingsTable = screen.getByText('Rank').closest('table');
    expect(rankingsTable).toBeInTheDocument();
    expect(rankingsTable).toHaveTextContent('Test Player 1');
    expect(rankingsTable).toHaveTextContent('Test Player 2');
    
    // Should see our final hand
    expect(screen.getByText('Your Final Hand')).toBeInTheDocument();
    
    // Should see all hands
    expect(screen.getByText('All Hands')).toBeInTheDocument();
    
    // Step 10: Return to the game list
    fireEvent.click(screen.getByText('Back to Game List'));
    
    // Should navigate back to the game list
    await waitFor(() => {
      expect(screen.getByText('Available Games')).toBeInTheDocument();
    });
  });
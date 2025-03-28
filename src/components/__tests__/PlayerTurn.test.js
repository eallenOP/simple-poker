// src/components/__tests__/PlayerTurn.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import PlayerTurn from '../PlayerTurn';

describe('PlayerTurn Component', () => {
  const mockPlayers = {
    'player1': {
      displayName: 'Player One',
      hasExchanged: false,
      uid: 'player1'
    },
    'player2': {
      displayName: 'Player Two',
      hasExchanged: true,
      uid: 'player2'
    },
    'player3': {
      displayName: 'Player Three',
      hasExchanged: false,
      uid: 'player3'
    }
  };

  const mockPlayerOrder = ['player1', 'player2', 'player3'];
  const mockCurrentTurn = 'player1';
  const mockCurrentUser = { uid: 'player1' };

  it('renders player turn information correctly', () => {
    render(
      <PlayerTurn
        players={mockPlayers}
        playerOrder={mockPlayerOrder}
        currentTurn={mockCurrentTurn}
        currentUser={mockCurrentUser}
      />
    );

    // Check heading is displayed
    expect(screen.getByText('Player Turn')).toBeInTheDocument();

    // Check all player names are displayed
    expect(screen.getByText(/Player One/)).toBeInTheDocument();
    expect(screen.getByText(/Player Two/)).toBeInTheDocument();
    expect(screen.getByText(/Player Three/)).toBeInTheDocument();

    // Check current user indicator
    expect(screen.getByText(/\(You\)/)).toBeInTheDocument();

    // Check player who has exchanged
    expect(screen.getByText(/Player Two/)).toBeInTheDocument();
    expect(screen.getByText(/✓/)).toBeInTheDocument();

    // Check turn message
    expect(screen.getByText("It's your turn!")).toBeInTheDocument();
  });

  it('displays waiting message when it is not the current user\'s turn', () => {
    const differentUser = { uid: 'player3' };
    
    render(
      <PlayerTurn
        players={mockPlayers}
        playerOrder={mockPlayerOrder}
        currentTurn={mockCurrentTurn}
        currentUser={differentUser}
      />
    );

    // Check waiting message
    expect(screen.getByText(/Waiting for Player One to make a move/)).toBeInTheDocument();
  });

  it('returns null when required props are missing', () => {
    const { container } = render(<PlayerTurn />);
    expect(container.firstChild).toBeNull();
  });
});
// src/components/__tests__/ExchangeCards.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExchangeCards from '../ExchangeCards';

describe('ExchangeCards Component', () => {
  const mockSelectedCards = [
    { suit: 'hearts', value: 'A', id: 'A_of_hearts' },
    { suit: 'diamonds', value: 'K', id: 'K_of_diamonds' }
  ];

  it('renders with selected cards count', () => {
    render(<ExchangeCards selectedCards={mockSelectedCards} />);
    
    expect(screen.getByText('Selected cards: 2 / 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exchange Cards/i })).toBeInTheDocument();
  });

  it('calls onExchange when button is clicked', () => {
    const mockExchange = jest.fn();
    
    render(
      <ExchangeCards 
        selectedCards={mockSelectedCards} 
        onExchange={mockExchange}
      />
    );
    
    const button = screen.getByRole('button', { name: /Exchange Cards/i });
    fireEvent.click(button);
    
    expect(mockExchange).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(
      <ExchangeCards 
        selectedCards={mockSelectedCards} 
        disabled={true}
      />
    );
    
    const button = screen.getByRole('button', { name: /Exchange Cards/i });
    expect(button).toBeDisabled();
  });

  it('shows hint when disabled and no cards selected', () => {
    render(
      <ExchangeCards 
        selectedCards={[]} 
        disabled={true}
      />
    );
    
    expect(screen.getByText('Select the cards you want to exchange')).toBeInTheDocument();
  });

  it('does not show hint when disabled but cards are selected', () => {
    render(
      <ExchangeCards 
        selectedCards={mockSelectedCards} 
        disabled={true}
      />
    );
    
    expect(screen.queryByText('Select the cards you want to exchange')).not.toBeInTheDocument();
  });

  it('handles empty selectedCards array', () => {
    render(<ExchangeCards selectedCards={[]} />);
    
    expect(screen.getByText('Selected cards: 0 / 5')).toBeInTheDocument();
  });
});
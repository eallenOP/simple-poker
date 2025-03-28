// src/components/__tests__/Card.test.js
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  // Sample card data
  const testCard = { suit: 'hearts', value: 'A', id: 'A_of_hearts' };
  
  it('renders correctly with proper suit and value', () => {
    render(<Card card={testCard} />);
    
    // Hearts should be represented by ♥ symbol
    expect(screen.getAllByText('♥')).toHaveLength(2); // Two instances, one in each corner
    
    // Card value should be displayed
    expect(screen.getAllByText('A')).toHaveLength(2); // Two instances, one in each corner
  });
  
  it('renders with the correct color based on suit', () => {
    // Hearts and diamonds are red, clubs and spades are black
    const { container } = render(<Card card={testCard} />);
    const cardElement = container.firstChild;
    
    // Check computed style
    expect(cardElement).toHaveStyle({ color: 'red' });
    
    // Now render a black card
    const blackCard = { suit: 'spades', value: 'K', id: 'K_of_spades' };
    const { container: blackContainer } = render(<Card card={blackCard} />);
    const blackCardElement = blackContainer.firstChild;
    
    expect(blackCardElement).toHaveStyle({ color: 'black' });
  });
  
  it('should apply selected class when isSelected is true', () => {
    const { container } = render(<Card card={testCard} isSelected={true} />);
    const cardElement = container.firstChild;
    
    expect(cardElement).toHaveClass('selected');
  });
  
  it('should not apply selected class when isSelected is false', () => {
    const { container } = render(<Card card={testCard} isSelected={false} />);
    const cardElement = container.firstChild;
    
    expect(cardElement).not.toHaveClass('selected');
  });
  
  it('should apply selectable class when selectable is true', () => {
    const { container } = render(<Card card={testCard} selectable={true} />);
    const cardElement = container.firstChild;
    
    expect(cardElement).toHaveClass('selectable');
  });
  
  it('should call onSelect when clicked and selectable', () => {
    const onSelectMock = jest.fn();
    render(
      <Card 
        card={testCard}
        selectable={true}
        onSelect={onSelectMock}
      />
    );
    
    // Find the card element and click it
    const cardElement = screen.getByText('A').closest('.card');
    fireEvent.click(cardElement);
    
    expect(onSelectMock).toHaveBeenCalledWith(testCard);
  });
  
  it('should not call onSelect when clicked but not selectable', () => {
    const onSelectMock = jest.fn();
    render(
      <Card 
        card={testCard}
        selectable={false}
        onSelect={onSelectMock}
      />
    );
    
    // Find the card element and click it
    const cardElement = screen.getByText('A').closest('.card');
    fireEvent.click(cardElement);
    
    expect(onSelectMock).not.toHaveBeenCalled();
  });
  
  it('should render all suit symbols correctly', () => {
    // Test each suit
    const suits = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    
    for (const [suitName, suitSymbol] of Object.entries(suits)) {
      const card = { suit: suitName, value: '10', id: `10_of_${suitName}` };
      render(<Card card={card} />);
      
      // Check that the correct symbol is rendered
      expect(screen.getAllByText(suitSymbol)).toHaveLength(2); // Two instances, one in each corner
      
      // Cleanup
      screen.unmount();
    }
  });
});
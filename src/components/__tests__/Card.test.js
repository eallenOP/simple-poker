// src/components/__tests__/Card.test.js
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  // Sample card data
  const testCard = { suit: 'hearts', value: 'A', id: 'A_of_hearts' };
  
  it('renders correctly with proper suit and value', () => {
    render(<Card card={testCard} />);
    
    // Hearts should be represented by ♥ symbol - use getAllByText since there are multiple
    expect(screen.getAllByText('♥').length).toBeGreaterThan(0);
    
    // Card value should be displayed - use getAllByText since there are multiple
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
  });
  
  it('renders with the correct color based on suit', () => {
    const { container } = render(<Card card={testCard} />);
    const cardElement = container.firstChild;
    
    // Hearts should have red color
    expect(cardElement).toHaveStyle({ color: 'red' });
    
    // Now render a black card
    const blackCard = { suit: 'spades', value: 'K', id: 'K_of_spades' };
    const { container: blackContainer } = render(<Card card={blackCard} />);
    const blackCardElement = blackContainer.firstChild;
    
    // Spades should have black color
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
    const { container } = render(
      <Card 
        card={testCard}
        selectable={true}
        onSelect={onSelectMock}
      />
    );
    
    // Find the card element directly from the container
    const cardElement = container.firstChild;
    fireEvent.click(cardElement);
    
    expect(onSelectMock).toHaveBeenCalled();
  });
  
  it('should not call onSelect when clicked but not selectable', () => {
    const onSelectMock = jest.fn();
    const { container } = render(
      <Card 
        card={testCard}
        selectable={false}
        onSelect={onSelectMock}
      />
    );
    
    // Find the card element directly from the container
    const cardElement = container.firstChild;
    fireEvent.click(cardElement);
    
    expect(onSelectMock).not.toHaveBeenCalled();
  });
  
  it('renders different suits correctly', () => {
    // Test each suit
    const suits = {
      'hearts': 'red',
      'diamonds': 'red',
      'clubs': 'black',
      'spades': 'black'
    };
    
    for (const [suit, color] of Object.entries(suits)) {
      const card = { suit, value: '10', id: `10_of_${suit}` };
      const { container, unmount } = render(<Card card={card} />);
      
      // Check color based on suit
      expect(container.firstChild).toHaveStyle({ color });
      
      // Clean up after each render
      unmount();
    }
  });
});
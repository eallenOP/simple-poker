// src/components/__tests__/Hand.test.js
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Hand from '../Hand';
import Card from '../Card';

// Mock the Card component
jest.mock('../Card', () => {
  return jest.fn(props => (
    <div 
      data-testid="mock-card" 
      data-suit={props.card.suit} 
      data-value={props.card.value}
      data-selected={props.isSelected ? 'true' : 'false'}
      data-selectable={props.selectable ? 'true' : 'false'}
      onClick={props.onSelect}
    >
      {props.card.value} of {props.card.suit}
    </div>
  ));
});

describe('Hand Component', () => {
  // Test data
  const testCards = [
    { suit: 'hearts', value: 'A', id: 'A_of_hearts' },
    { suit: 'diamonds', value: 'K', id: 'K_of_diamonds' },
    { suit: 'clubs', value: 'Q', id: 'Q_of_clubs' },
    { suit: 'spades', value: 'J', id: 'J_of_spades' },
    { suit: 'hearts', value: '10', id: '10_of_hearts' }
  ];
  
  beforeEach(() => {
    Card.mockClear();
  });
  
  it('renders the correct number of cards', () => {
    render(<Hand cards={testCards} />);
    
    // Should render 5 cards
    expect(screen.getAllByTestId('mock-card')).toHaveLength(5);
    
    // Card component should be called 5 times
    expect(Card).toHaveBeenCalledTimes(5);
  });
  
  it('renders an empty hand when no cards are provided', () => {
    render(<Hand cards={[]} />);
    
    // Should not render any cards
    expect(screen.queryByTestId('mock-card')).not.toBeInTheDocument();
    
    // Card component should not be called
    expect(Card).not.toHaveBeenCalled();
  });
  
  it('applies current-player class when isCurrentPlayer is true', () => {
    const { container } = render(<Hand cards={testCards} isCurrentPlayer={true} />);
    
    // Hand container should have current-player class
    expect(container.firstChild).toHaveClass('hand');
    expect(container.firstChild).toHaveClass('current-player');
  });
  
  it('does not apply current-player class when isCurrentPlayer is false', () => {
    const { container } = render(<Hand cards={testCards} isCurrentPlayer={false} />);
    
    // Hand container should not have current-player class
    expect(container.firstChild).toHaveClass('hand');
    expect(container.firstChild).not.toHaveClass('current-player');
  });
  
  it('passes correct selectedCards to Card components', () => {
    // Select the second card
    const selectedCards = [testCards[1]];
    
    render(<Hand cards={testCards} selectedCards={selectedCards} />);
    
    // Get all card elements
    const cardElements = screen.getAllByTestId('mock-card');
    
    // Second card should be selected
    expect(cardElements[1]).toHaveAttribute('data-selected', 'true');
    
    // Other cards should not be selected
    expect(cardElements[0]).toHaveAttribute('data-selected', 'false');
    expect(cardElements[2]).toHaveAttribute('data-selected', 'false');
    expect(cardElements[3]).toHaveAttribute('data-selected', 'false');
    expect(cardElements[4]).toHaveAttribute('data-selected', 'false');
  });
  
  it('passes selectable flag to Card components when canSelectCards and isCurrentPlayer are true', () => {
    render(
      <Hand 
        cards={testCards} 
        canSelectCards={true} 
        isCurrentPlayer={true}
      />
    );
    
    // All cards should be selectable
    const cardElements = screen.getAllByTestId('mock-card');
    cardElements.forEach(card => {
      expect(card).toHaveAttribute('data-selectable', 'true');
    });
  });
  
  it('does not make cards selectable when canSelectCards is false', () => {
    render(
      <Hand 
        cards={testCards} 
        canSelectCards={false} 
        isCurrentPlayer={true}
      />
    );
    
    // Cards should not be selectable
    const cardElements = screen.getAllByTestId('mock-card');
    cardElements.forEach(card => {
      expect(card).toHaveAttribute('data-selectable', 'false');
    });
  });
  
  it('does not make cards selectable when isCurrentPlayer is false', () => {
    render(
      <Hand 
        cards={testCards} 
        canSelectCards={true} 
        isCurrentPlayer={false}
      />
    );
    
    // Cards should not be selectable
    const cardElements = screen.getAllByTestId('mock-card');
    cardElements.forEach(card => {
      expect(card).toHaveAttribute('data-selectable', 'false');
    });
  });
  
  it('calls onSelectCard when a card is clicked', () => {
    // Mock the onSelectCard function
    const onSelectMock = jest.fn();
    
    render(
      <Hand 
        cards={testCards} 
        onSelectCard={onSelectMock}
        canSelectCards={true}
        isCurrentPlayer={true}
      />
    );
    
    // Get all card elements
    const cardElements = screen.getAllByTestId('mock-card');
    
    // Click the first card
    fireEvent.click(cardElements[0]);
    
    // onSelectCard should be called with the first card
    expect(onSelectMock).toHaveBeenCalledWith(testCards[0]);
  });
  
  it('does not call onSelectCard when a card is clicked but canSelectCards is false', () => {
    // Mock the onSelectCard function
    const onSelectMock = jest.fn();
    
    render(
      <Hand 
        cards={testCards} 
        onSelectCard={onSelectMock}
        canSelectCards={false}
        isCurrentPlayer={true}
      />
    );
    
    // Get all card elements
    const cardElements = screen.getAllByTestId('mock-card');
    
    // Click the first card
    fireEvent.click(cardElements[0]);
    
    // onSelectCard should not be called
    expect(onSelectMock).not.toHaveBeenCalled();
  });
});
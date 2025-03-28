// src/components/__tests__/Hand.test.js
import React from 'react';
import { render } from '@testing-library/react';
import Hand from '../Hand';

// Direct integration test without mocking Card
describe('Hand Component', () => {
  const mockCards = [
    { suit: 'hearts', value: 'A', id: 'A_of_hearts' },
    { suit: 'diamonds', value: 'K', id: 'K_of_diamonds' },
    { suit: 'clubs', value: 'Q', id: 'Q_of_clubs' }
  ];

  it('renders the hand container with correct class', () => {
    const { container } = render(<Hand cards={mockCards} />);
    expect(container.firstChild).toHaveClass('hand');
  });

  it('adds current-player class when isCurrentPlayer is true', () => {
    const { container } = render(<Hand cards={mockCards} isCurrentPlayer={true} />);
    expect(container.firstChild).toHaveClass('hand');
    expect(container.firstChild).toHaveClass('current-player');
  });

  it('does not add current-player class when isCurrentPlayer is false', () => {
    const { container } = render(<Hand cards={mockCards} isCurrentPlayer={false} />);
    expect(container.firstChild).toHaveClass('hand');
    expect(container.firstChild).not.toHaveClass('current-player');
  });

  it('works with an empty cards array', () => {
    const { container } = render(<Hand cards={[]} />);
    expect(container.firstChild).toHaveClass('hand');
  });

  it('renders the correct number of children (cards)', () => {
    const { container } = render(<Hand cards={mockCards} />);
    // Each card should render as a child in the hand
    // We're not checking for specific card elements to avoid dependency on Card implementation
    expect(container.firstChild.children.length).toBe(mockCards.length);
  });

  it('works with all props', () => {
    // Just testing that it renders without errors with all possible props
    const { container } = render(
      <Hand 
        cards={mockCards}
        selectedCards={[mockCards[0]]}
        onSelectCard={jest.fn()}
        canSelectCards={true}
        isCurrentPlayer={true}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
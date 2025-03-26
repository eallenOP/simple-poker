// src/components/Hand.js
import React from 'react';
import Card from './Card';
import './Hand.css';

const Hand = ({ 
  cards, 
  selectedCards = [], 
  onSelectCard, 
  canSelectCards = false,
  isCurrentPlayer = false
}) => {
  const handleSelectCard = (card) => {
    if (onSelectCard && canSelectCards) {
      onSelectCard(card);
    }
  };
  
  return (
    <div className={`hand ${isCurrentPlayer ? 'current-player' : ''}`}>
      {cards.map((card, index) => (
        <Card
          key={card.id || `${card.value}_of_${card.suit}_${index}`}
          card={card}
          isSelected={selectedCards.some(c => 
            c.value === card.value && c.suit === card.suit
          )}
          onSelect={() => handleSelectCard(card)}
          selectable={canSelectCards && isCurrentPlayer}
        />
      ))}
    </div>
  );
};

export default Hand;
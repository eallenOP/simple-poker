// src/components/Card.js
import React from 'react';
import './Card.css';

const Card = ({ card, isSelected, onSelect, selectable }) => {
  const { suit, value } = card;
  
  const getSuitSymbol = (suit) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return suit;
    }
  };
  
  const getSuitColor = (suit) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
  };
  
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(card);
    }
  };
  
  return (
    <div 
      className={`card ${isSelected ? 'selected' : ''} ${selectable ? 'selectable' : ''}`}
      onClick={handleClick}
      style={{ color: getSuitColor(suit) }}
    >
      <div className="card-corner top-left">
        <div className="card-value">{value}</div>
        <div className="card-suit">{getSuitSymbol(suit)}</div>
      </div>
      
      <div className="card-center">
        <div className="card-suit-large">{getSuitSymbol(suit)}</div>
      </div>
      
      <div className="card-corner bottom-right">
        <div className="card-value">{value}</div>
        <div className="card-suit">{getSuitSymbol(suit)}</div>
      </div>
    </div>
  );
};

export default Card;
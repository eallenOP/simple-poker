// src/components/ExchangeCards.js
import React from 'react';
import './ExchangeCards.css';

const ExchangeCards = ({ selectedCards, onExchange, disabled }) => {
  return (
    <div className="exchange-cards">
      <div className="selected-count">
        Selected cards: {selectedCards.length} / 5
      </div>
      
      <button
        className="exchange-btn"
        onClick={onExchange}
        disabled={disabled}
      >
        Exchange Cards
      </button>
      
      {disabled && selectedCards.length === 0 && (
        <div className="exchange-hint">
          Select the cards you want to exchange
        </div>
      )}
    </div>
  );
};

export default ExchangeCards;

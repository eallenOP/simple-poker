// src/services/cardService.js
// Card suits and values
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Create a fresh deck of cards
export const createDeck = () => {
  const deck = [];
  
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        suit,
        value,
        id: `${value}_of_${suit}`
      });
    }
  }
  
  return deck;
};

// Shuffle the deck using Fisher-Yates algorithm
export const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// Deal cards to players
export const dealCards = (deck, numPlayers, cardsPerPlayer = 5) => {
  const hands = [];
  
  for (let i = 0; i < numPlayers; i++) {
    const hand = [];
    for (let j = 0; j < cardsPerPlayer; j++) {
      hand.push(deck.pop());
    }
    hands.push(hand);
  }
  
  return {
    hands,
    remainingDeck: deck
  };
};

// Exchange cards
export const exchangeCards = (hand, cardsToExchangeIndices, deck) => {
  const newHand = [...hand];
  
  for (const index of cardsToExchangeIndices) {
    if (index >= 0 && index < hand.length && deck.length > 0) {
      newHand[index] = deck.pop();
    }
  }
  
  return {
    newHand,
    remainingDeck: deck
  };
};

// Get the card rank value (for comparing)
const getCardRank = (card) => {
  const valueRanks = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  
  return valueRanks[card.value];
};

// Helper function to count occurrences of card values
const countValues = (hand) => {
  const counts = {};
  
  for (const card of hand) {
    counts[card.value] = (counts[card.value] || 0) + 1;
  }
  
  return counts;
};

// Check for various poker hands
const checkRoyalFlush = (hand) => {
  const isFlush = checkFlush(hand);
  const isStraight = checkStraight(hand);
  
  if (isFlush && isStraight) {
    const sortedHand = [...hand].sort((a, b) => getCardRank(a) - getCardRank(b));
    return getCardRank(sortedHand[sortedHand.length - 1]) === 14; // Ace is highest
  }
  
  return false;
};

const checkStraightFlush = (hand) => {
  return checkFlush(hand) && checkStraight(hand);
};

const checkFourOfAKind = (hand) => {
  const counts = countValues(hand);
  return Object.values(counts).includes(4);
};

const checkFullHouse = (hand) => {
  const counts = countValues(hand);
  const values = Object.values(counts);
  return values.includes(3) && values.includes(2);
};

const checkFlush = (hand) => {
  const suit = hand[0].suit;
  return hand.every(card => card.suit === suit);
};

const checkStraight = (hand) => {
  const ranks = hand.map(card => getCardRank(card)).sort((a, b) => a - b);
  
  // Check for A-5 straight
  if (ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5 && ranks[4] === 14) {
    return true;
  }
  
  // Check for normal straight
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] !== ranks[i - 1] + 1) {
      return false;
    }
  }
  
  return true;
};

const checkThreeOfAKind = (hand) => {
  const counts = countValues(hand);
  return Object.values(counts).includes(3);
};

const checkTwoPair = (hand) => {
  const counts = countValues(hand);
  const pairs = Object.values(counts).filter(count => count === 2);
  return pairs.length === 2;
};

const checkOnePair = (hand) => {
  const counts = countValues(hand);
  return Object.values(counts).includes(2);
};

// Evaluate a hand and return its ranking
export const evaluateHand = (hand) => {
  if (checkRoyalFlush(hand)) return { rank: 10, name: 'Royal Flush' };
  if (checkStraightFlush(hand)) return { rank: 9, name: 'Straight Flush' };
  if (checkFourOfAKind(hand)) return { rank: 8, name: 'Four of a Kind' };
  if (checkFullHouse(hand)) return { rank: 7, name: 'Full House' };
  if (checkFlush(hand)) return { rank: 6, name: 'Flush' };
  if (checkStraight(hand)) return { rank: 5, name: 'Straight' };
  if (checkThreeOfAKind(hand)) return { rank: 4, name: 'Three of a Kind' };
  if (checkTwoPair(hand)) return { rank: 3, name: 'Two Pair' };
  if (checkOnePair(hand)) return { rank: 2, name: 'One Pair' };
  return { rank: 1, name: 'High Card' };
};

// Determine the winner among multiple hands
export const determineWinner = (hands) => {
  const evaluations = hands.map((hand, index) => ({
    playerId: index,
    evaluation: evaluateHand(hand),
    hand
  }));
  
  // Sort by rank (highest first)
  evaluations.sort((a, b) => {
    if (b.evaluation.rank !== a.evaluation.rank) {
      return b.evaluation.rank - a.evaluation.rank;
    }
    
    // If ranks are the same, compare high cards
    const handA = [...a.hand].sort((c, d) => getCardRank(d) - getCardRank(c));
    const handB = [...b.hand].sort((c, d) => getCardRank(d) - getCardRank(c));
    
    for (let i = 0; i < handA.length; i++) {
      const rankA = getCardRank(handA[i]);
      const rankB = getCardRank(handB[i]);
      
      if (rankA !== rankB) {
        return rankB - rankA;
      }
    }
    
    return 0; // Tie
  });
  
  return evaluations;
};

// src/components/Auth.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { setupNetworkListeners } from '../services/offlineService';
import './Auth.css';

const Auth = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  
  useEffect(() => {
    // Set up network listeners for online/offline events
    setupNetworkListeners();
    
    // Try to get display name from localStorage
    const savedName = localStorage.getItem('userDisplayName');
    if (savedName) {
      setDisplayName(savedName);
    }
  }, []);
  
  useEffect(() => {
    // If user is authenticated, update display name
    if (currentUser && displayName) {
      updateDisplayName();
    }
  }, [currentUser, displayName]);
  
  const updateDisplayName = async () => {
    try {
      // Save display name to localStorage
      localStorage.setItem('userDisplayName', displayName);
    } catch (error) {
      console.error('Error updating display name:', error);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    updateDisplayName();
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!currentUser) {
    return <div className="loading">Authenticating...</div>;
  }
  
  // Check if user needs to set a display name
  if (!displayName) {
    return (
      <div className="auth-container">
        <div className="welcome-screen">
          <h2>Welcome to Simple Poker</h2>
          <p>Please enter a display name to continue</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                required
              />
            </div>
            
            <button
              type="submit"
              className="continue-btn"
              disabled={!displayName.trim()}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  // User is authenticated and has a display name
  return children;
};

export default Auth;

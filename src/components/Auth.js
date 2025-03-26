// src/components/Auth.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { setupNetworkListeners } from '../services/offlineService';
import { updateUserDisplayName } from '../services/authService';
import './Auth.css';

const Auth = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameSubmitted, setNameSubmitted] = useState(false);
  
  useEffect(() => {
    // Set up network listeners for online/offline events
    setupNetworkListeners();
    
    // Try to get display name from localStorage
    const savedName = localStorage.getItem('userDisplayName');
    if (savedName) {
      setDisplayName(savedName);
      setNameSubmitted(true);
    }
  }, []);
  
  const updateDisplayName = async () => {
    if (!displayName.trim() || !currentUser) return;
    
    try {
      setIsSubmitting(true);
      
      // Update Firebase user profile
      await updateUserDisplayName(displayName);
      
      // Save display name to localStorage
      localStorage.setItem('userDisplayName', displayName);
      setNameSubmitted(true);
    } catch (error) {
      console.error('Error updating display name:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      // Require at least 2 characters
      return;
    }
    updateDisplayName();
  };

  const handleKeyDown = (e) => {
    // Prevent form submission on Enter unless name is valid
    if (e.key === 'Enter' && displayName.trim().length < 2) {
      e.preventDefault();
    }
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!currentUser) {
    return <div className="loading">Authenticating...</div>;
  }
  
  // Check if user needs to set a display name
  if (!nameSubmitted) {
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
                onKeyDown={handleKeyDown}
                placeholder="Enter your display name (min 2 characters)"
                minLength="2"
                required
              />
              {displayName.trim().length === 1 && (
                <div className="validation-message">Name must be at least 2 characters</div>
              )}
            </div>
            
            <button
              type="submit"
              className="continue-btn"
              disabled={isSubmitting || displayName.trim().length < 2}
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
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
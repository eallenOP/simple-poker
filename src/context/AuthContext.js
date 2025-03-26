// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { signInAnonymous, subscribeToAuthChanges } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Sign in anonymously if no user
    const signInIfNeeded = async () => {
      try {
        if (!currentUser) {
          await signInAnonymous();
        }
      } catch (error) {
        console.error("Failed to sign in anonymously:", error);
      }
    };

    signInIfNeeded();

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// src/services/authService.js
import { signInAnonymously, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth } from './firebase';

// Sign in anonymously
export const signInAnonymous = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    throw error;
  }
};

// Update user's display name
export const updateUserDisplayName = async (displayName) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');
    
    await updateProfile(user, {
      displayName: displayName
    });
    
    return true;
  } catch (error) {
    console.error("Error updating user display name:", error);
    throw error;
  }
};

// Listen for auth state changes
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};
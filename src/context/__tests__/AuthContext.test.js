// src/context/__tests__/AuthContext.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { signInAnonymous, subscribeToAuthChanges } from '../../services/authService';

// Mock the auth service
jest.mock('../../services/authService', () => ({
  signInAnonymous: jest.fn(),
  subscribeToAuthChanges: jest.fn(),
  getCurrentUser: jest.fn(),
  updateUserDisplayName: jest.fn()
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { currentUser, loading } = useAuth();
  return (
    <div>
      {loading ? (
        <div data-testid="loading">Loading...</div>
      ) : (
        <div data-testid="auth-status">
          {currentUser ? `Logged in as ${currentUser.uid}` : 'Not logged in'}
        </div>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    // Setup mock to delay auth state change
    let authCallback;
    subscribeToAuthChanges.mockImplementation((callback) => {
      authCallback = callback;
      return jest.fn(); // return unsubscribe function
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should be in loading state initially
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should update when user signs in', async () => {
    // Setup mock with a test user
    const testUser = { uid: 'test123', displayName: 'Test User' };
    let authCallback;

    subscribeToAuthChanges.mockImplementation((callback) => {
      authCallback = callback;
      return jest.fn(); // return unsubscribe function
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Simulate auth state change - wrapped in act()
    await act(async () => {
      authCallback(testUser);
    });

    // Should have attempted to sign in anonymously if no user
    expect(signInAnonymous).toHaveBeenCalled();

    // Wait for component to update
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as test123');
  });

  it('should handle sign out', async () => {
    // Setup mock with initial authenticated user
    const testUser = { uid: 'test123', displayName: 'Test User' };
    let authCallback;

    subscribeToAuthChanges.mockImplementation((callback) => {
      authCallback = callback;
      return jest.fn(); // return unsubscribe function
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state - user is logged in
    await act(async () => {
      authCallback(testUser);
    });

    // Should show logged in state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as test123');

    // Simulate sign out - user becomes null
    await act(async () => {
      authCallback(null);
    });

    // Should show not logged in state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not logged in');
  });

  it('should unsubscribe from auth changes on unmount', () => {
    // Setup unsubscribe mock
    const unsubscribeMock = jest.fn();
    subscribeToAuthChanges.mockReturnValue(unsubscribeMock);

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Unmount component
    unmount();

    // Unsubscribe should have been called
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
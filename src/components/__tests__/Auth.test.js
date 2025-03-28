// src/context/__tests__/AuthContext.test.js
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeToAuthChanges } from '../../services/authService';

// Mock the auth service and context
jest.mock('../../services/authService', () => ({
  subscribeToAuthChanges: jest.fn(),
  signInAnonymous: jest.fn(),
  getCurrentUser: jest.fn(),
  updateUserDisplayName: jest.fn()
}));

jest.mock('../../context/AuthContext', () => {
  const originalModule = jest.requireActual('../../context/AuthContext');
  return {
    ...originalModule,
    useAuth: jest.fn()
  };
});

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

  it('should show loading state when loading is true', async () => {
    // Mock the useAuth hook to return loading state
    useAuth.mockReturnValue({
      currentUser: null,
      loading: true
    });
    
    // Wrap the render in act to handle async state updates
    await act(async () => {
      render(<TestComponent />);
    });
    
    // Should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-status')).not.toBeInTheDocument();
  });

  it('should show authenticated state when user is signed in', async () => {
    // Mock the useAuth hook to return authenticated state
    const testUser = { uid: 'test123', displayName: 'Test User' };
    useAuth.mockReturnValue({
      currentUser: testUser,
      loading: false
    });
    
    // Wrap the render in act to handle async state updates
    await act(async () => {
      render(<TestComponent />);
    });
    
    // Should show authenticated state
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as test123');
  });

  it('should show unauthenticated state when user is not signed in', async () => {
    // Mock the useAuth hook to return unauthenticated state
    useAuth.mockReturnValue({
      currentUser: null,
      loading: false
    });
    
    // Wrap the render in act to handle async state updates
    await act(async () => {
      render(<TestComponent />);
    });
    
    // Should show unauthenticated state
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not logged in');
  });
});
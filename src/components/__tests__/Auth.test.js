// src/components/__tests__/Auth.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Auth from '../Auth';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { setupNetworkListeners } from '../../services/offlineService';
import { updateUserDisplayName } from '../../services/authService';

// Mock dependencies
jest.mock('../../context/AuthContext', () => {
  const original = jest.requireActual('../../context/AuthContext');
  return {
    ...original,
    useAuth: jest.fn()
  };
});

jest.mock('../../services/offlineService', () => ({
  setupNetworkListeners: jest.fn()
}));

jest.mock('../../services/authService', () => ({
  updateUserDisplayName: jest.fn()
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Auth Component', () => {
  const mockChildComponent = <div data-testid="child-component">Child Component</div>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });
  
  test('renders loading state when auth is loading', () => {
    // Mock the auth context with loading state
    useAuth.mockReturnValue({
      currentUser: null,
      loading: true
    });
    
    render(<Auth>{mockChildComponent}</Auth>);
    
    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Should not render child component
    expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
  });
  
  test('renders authenticating state when no user', () => {
    // Mock the auth context with no user
    useAuth.mockReturnValue({
      currentUser: null,
      loading: false
    });
    
    render(<Auth>{mockChildComponent}</Auth>);
    
    // Should show authenticating state
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    
    // Should not render child component
    expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
  });
  
  test('renders welcome screen when user needs to set display name', () => {
    // Mock the auth context with user but no display name in localStorage
    useAuth.mockReturnValue({
      currentUser: { uid: 'user123' },
      loading: false
    });
    
    render(<Auth>{mockChildComponent}</Auth>);
    
    // Should show welcome screen
    expect(screen.getByText('Welcome to Simple Poker')).toBeInTheDocument();
    expect(screen.getByText('Please enter a display name to continue')).toBeInTheDocument();
    
    // Should have display name input
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    
    // Should not render child component
    expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
    
    // Should setup network listeners
    expect(setupNetworkListeners).toHaveBeenCalled();
  });
  
  test('renders child components when user has already set display name', () => {
    // Mock the auth context with a user
    useAuth.mockReturnValue({
      currentUser: { uid: 'user123' },
      loading: false
    });
    
    // Mock localStorage with a saved display name
    localStorageMock.getItem.mockReturnValue('Test Player');
    
    render(<Auth>{mockChildComponent}</Auth>);
    
    // Should render child component
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    
    // Should not show welcome screen
    expect(screen.queryByText('Welcome to Simple Poker')).not.toBeInTheDocument();
  });
  
  test('validates display name input', async () => {
    // Mock the auth context with a user
    useAuth.mockReturnValue({
      currentUser: { uid: 'user123' },
      loading: false
    });
    
    render(<Auth>{mockChildComponent}</Auth>);
    
    const nameInput = screen.getByLabelText('Display Name');
    const continueButton = screen.getByText('Continue');
    
    // Button should be disabled initially
    expect(continueButton).toBeDisabled();
    
    // Enter a single character (too short)
    fireEvent.change(nameInput, { target: { value: 'A' } });
    
    // Should show validation message
    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    
    // Button should still be disabled
    expect(continueButton).toBeDisabled();
    
    // Enter a valid name
    fireEvent.change(nameInput, { target: { value: 'Test Player' } });
    
    // Validation message should disappear
    expect(screen.queryByText('Name must be at least 2 characters')).not.toBeInTheDocument();
    
    // Button should be enabled
    expect(continueButton).not.toBeDisabled();
  });
  
  test('submits display name and saves to localStorage', async () => {
    // Mock the auth service
    updateUserDisplayName.mockResolvedValue(true);
    
    // Mock the auth context with a user
    useAuth.mockReturnValue({
      currentUser: { uid: 'user123' },
      loading: false
    });
    
    render(<Auth>{mockChildComponent}</Auth>);
    
    const nameInput = screen.getByLabelText('Display Name');
    const continueButton = screen.getByText('Continue');
    
    // Enter a valid name
    fireEvent.change(nameInput, { target: { value: 'Test Player' } });
    
    // Submit the form
    fireEvent.click(continueButton);
    
    // Should call updateUserDisplayName
    expect(updateUserDisplayName).toHaveBeenCalledWith('Test Player');
    
    // Should save to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('userDisplayName', 'Test Player');
    
    // Should render child component after submission
    await waitFor(() => {
      expect(screen.getByTestId('child-component')).toBeInTheDocument();
    });
  });
  
  test('handles submission errors', async () => {
    // Mock the auth service to throw an error
    updateUserDisplayName.mockRejectedValue(new Error('Update failed'));
    
    // Mock console.error to prevent error output in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock the auth context with a user
    useAuth.mockReturnValue({
      currentUser: { uid: 'user123' },
      loading: false
    });
    
    render(<Auth>{mockChildComponent}</Auth>);
    
    const nameInput = screen.getByLabelText('Display Name');
    const continueButton = screen.getByText('Continue');
    
    // Enter a valid name
    fireEvent.change(nameInput, { target: { value: 'Test Player' } });
    
    // Submit the form
    fireEvent.click(continueButton);
    
    // Button should show "Saving..." during submission
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    // Should still show the welcome screen after error
    await waitFor(() => {
      expect(screen.getByText('Continue')).toBeInTheDocument(); // Back to normal text
    });
    
    // Should not render child component
    expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
    
    // Should not save to localStorage
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    
    // Restore console.error
    console.error.mockRestore();
  });
  
  test('prevents form submission on Enter if name is invalid', () => {
    // Mock the auth context with a user
    useAuth.mockReturnValue({
      currentUser: { uid: 'user123' },
      loading: false
    });
    
    render(<Auth>{mockChildComponent}</Auth>);
    
    const nameInput = screen.getByLabelText('Display Name');
    
    // Enter a single character (too short)
    fireEvent.change(nameInput, { target: { value: 'A' } });
    
    // Setup a mock for preventDefault
    const preventDefaultMock = jest.fn();
    
    // Simulate Enter key
    fireEvent.keyDown(nameInput, { key: 'Enter', preventDefault: preventDefaultMock });
    
    // Should prevent default behavior
    expect(preventDefaultMock).toHaveBeenCalled();
    
    // Change to valid name
    fireEvent.change(nameInput, { target: { value: 'Test Player' } });
    
    // Reset mock
    preventDefaultMock.mockClear();
    
    // Simulate Enter key again
    fireEvent.keyDown(nameInput, { key: 'Enter', preventDefault: preventDefaultMock });
    
    // Should not prevent default behavior (allows form submission)
    expect(preventDefaultMock).not.toHaveBeenCalled();
  });
});
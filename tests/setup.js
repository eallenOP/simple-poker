// tests/setup.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Increase the default timeout for async tests
jest.setTimeout(10000);

// Configure Testing Library
configure({
  testIdAttribute: 'data-testid',
});

// Mock IndexedDB
require('fake-indexeddb/auto');

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.serviceWorker
Object.defineProperty(window.navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue({ scope: '/' }),
    getRegistrations: jest.fn().mockResolvedValue([]),
    ready: Promise.resolve({
      active: {
        postMessage: jest.fn(),
      },
    }),
  },
});

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: An update to') ||
      args[0].includes('Warning: validateDOMNesting') ||
      args[0].includes('Warning: Failed prop type') ||
      args[0].includes('ReactDOM.render is no longer supported'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock the Intersection Observer
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};
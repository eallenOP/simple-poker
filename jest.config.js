// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    transform: {
      '^.+\\.(js|jsx)$': 'babel-jest',
    },
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
    },
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/tests/',
      '/__mocks__/',
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
      '<rootDir>/tests/**/*.{js,jsx}',
    ],
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/build/',
    ],
    watchPathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/build/',
    ],
    collectCoverageFrom: [
      'src/**/*.{js,jsx}',
      '!src/**/*.d.ts',
      '!src/**/index.js',
      '!src/serviceWorkerRegistration.js',
      '!src/reportWebVitals.js',
    ],
  };
// jest.config.js
// Focused Jest configuration for the current Node backend layer

module.exports = {
  displayName: 'StudyHub Backend Tests',
  testEnvironment: 'node',
  rootDir: './',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.git/',
    '/cache/__tests__/',
    '/jobs/__tests__/',
    '/__tests__/integration/',
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@cache/(.*)$': '<rootDir>/cache/$1',
    '^@models/(.*)$': '<rootDir>/accounts/models.js',
    '^@utils/(.*)$': '<rootDir>/accounts/utils.js',
  },
  testTimeout: 10000,
  globals: {
    NODE_ENV: 'test',
  },
  reporters: ['default'],
  detectOpenHandles: false,
  forceExit: true,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: '50%',
};

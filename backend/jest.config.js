module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  clearMocks: true,
  globals: {
    'ts-jest': {
      tsconfig: { esModuleInterop: true }
    }
  },
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};


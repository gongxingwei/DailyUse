module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/electron'],
  testMatch: [
    '**/__tests__/**/*.(ts|js)',
    '**/*.(test|spec).(ts|js)'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        module: 'commonjs'
      }
    }]
  },
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/dist-electron/'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@electron/(.*)$': '<rootDir>/electron/$1'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    'electron/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!electron/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/dist-electron/**'
  ],
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};

/** Jest config for unit tests (e.g. lib/movements applyMovement). */
module.exports = {
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  preset: 'ts-jest',
  testEnvironment: 'node',
};

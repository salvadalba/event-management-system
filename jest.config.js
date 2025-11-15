module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/server/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/client/'],
  setupFiles: ['<rootDir>/server/tests/setup.js'],
}

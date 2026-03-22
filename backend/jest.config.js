/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
  },
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
};

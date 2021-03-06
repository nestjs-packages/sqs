module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: 'test/.*\\.(test|spec).(ts|tsx|js)$',
  collectCoverageFrom: ['lib/**/*.{js,jsx,tsx,ts}', '!**/node_modules/**', '!**/vendor/**', '!**/*.spec.ts'],
  coverageReporters: ['lcov', 'json', 'text'],
  coverageDirectory: 'coverage/unit',
};

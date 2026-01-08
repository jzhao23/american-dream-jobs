/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/test/tsconfig.json'
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    'src/lib/**/*.ts',
    'src/lib/**/*.tsx',
    'src/components/**/*.tsx',
    '!**/*.d.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  verbose: true,
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/api/**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: '<rootDir>/test/tsconfig.json'
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    },
    {
      displayName: 'components',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/test/components/**/*.test.tsx'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: '<rootDir>/test/tsconfig.json'
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/test/setup.ts', '<rootDir>/test/setup-dom.ts'],
    }
  ]
};

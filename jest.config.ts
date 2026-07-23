import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  displayName: 'bys-formation',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // @react-pdf/renderer is ESM and CPU-bound — irrelevant in unit tests.
    // Real PDF rendering is exercised via E2E + manual recette.
    '^@/lib/pdf-helpers$': '<rootDir>/__tests__/helpers/pdf-helpers.mock.ts',
    '^@react-pdf/renderer$': '<rootDir>/__tests__/helpers/react-pdf.mock.ts',
    // Le SDK Auth0 est ESM pur : sans ce stub, toute suite important une route
    // protégée casse sur « Unexpected token 'export' ».
    '^@auth0/nextjs-auth0/server$': '<rootDir>/__tests__/helpers/auth0-sdk.mock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/e2e/', '<rootDir>/__tests__/helpers/', '<rootDir>/.claude/'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

export default createJestConfig(config)

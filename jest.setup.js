// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/setup/prisma.ts
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
process.env.NEXTAUTH_SECRET = process.env.TEST_NEXTAUTH_SECRET || 'test-secret'
process.env.NEXTAUTH_URL = process.env.TEST_NEXTAUTH_URL || 'http://localhost:3000'


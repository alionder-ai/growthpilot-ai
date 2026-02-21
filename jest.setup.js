// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Load environment variables for testing
require('dotenv').config({ path: '.env.local' })

// Set default test timeout
jest.setTimeout(30000)

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

// Setup global test utilities
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms))

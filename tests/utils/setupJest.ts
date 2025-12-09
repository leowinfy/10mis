// Jest setup file for Node environment
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const testDir = join(process.cwd(), 'test-data')
const dbDir = join(testDir, 'db')
const uploadsDir = join(testDir, 'uploads')

// Create test directories
beforeAll(() => {
  mkdirSync(testDir, { recursive: true })
  mkdirSync(dbDir, { recursive: true })
  mkdirSync(uploadsDir, { recursive: true })

  // Create empty diaries.json
  writeFileSync(join(dbDir, 'diaries.json'), JSON.stringify([]), 'utf-8')

  // Set environment variables
  process.env.DATABASE_DIR = dbDir
  process.env.UPLOAD_DIR = uploadsDir
  process.env.NODE_ENV = 'test'
})

// Clean up after tests
afterAll(() => {
  // Note: In a real scenario, you might want to clean up test files here
  // Be careful with rm -rf in Windows
})
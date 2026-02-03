import { findFilesByName, findFilesByPattern } from './shared/file-finder.js'
import path from 'path'

const testDir = path.resolve('../') // Parent directory

console.log('Testing File Finder...\n')

// Test 1: Find specific JSON files
console.log('1. Finding .gitignore files...')
const gitignoreFiles = await findFilesByName(testDir, '.gitignore', {
  maxDepth: 3,
  onProgress: (current) => {
    if (current % 50 === 0) console.log(`  Processed ${current} files...`)
  }
})
console.log(`  Found ${gitignoreFiles.length} .gitignore file(s)`)
gitignoreFiles.forEach(f => console.log(`    - ${f}`))

// Test 2: Find by pattern
console.log('\n2. Finding all .json files...')
const jsonFiles = await findFilesByPattern(testDir, '**/*.json', {
  exclude: ['node_modules/**', '**/test-output/**']
})
console.log(`  Found ${jsonFiles.length} .json file(s)`)
console.log(`  First 5: ${jsonFiles.slice(0, 5).join(', ')}`)

console.log('\n✓ File Finder tests complete')

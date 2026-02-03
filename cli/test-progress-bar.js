import { createProgressBar, displaySpinner, timedOperation } from './shared/progress-bar.js'

console.log('Testing Progress Bar...\n')

// Test 1: Simple progress bar
console.log('1. Testing progress bar...')
const bar = createProgressBar(100)
bar.start()

for (let i = 0; i <= 100; i++) {
  await new Promise(resolve => setTimeout(resolve, 20))
  bar.update(i, { currentFile: `file-${i}.jpg` })
}
bar.complete()

// Test 2: Spinner
console.log('\n2. Testing spinner...')
const spinner = displaySpinner('Loading data...')
await new Promise(resolve => setTimeout(resolve, 2000))
spinner.stop('Data loaded successfully', true)

// Test 3: Timed operation
console.log('\n3. Testing timed operation...')
await timedOperation('Processing files', async () => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  return 'Done'
})

console.log('\n✓ Progress Bar tests complete')

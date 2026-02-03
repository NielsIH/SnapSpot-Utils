/**
 * Run all Phase 7A tests
 */

import chalk from 'chalk'

const tests = [
  { name: 'File Finder', file: './test-file-finder.js' },
  { name: 'Export Loader', file: './test-export-loader.js' },
  { name: 'Export Writer', file: './test-export-writer.js' },
  { name: 'Progress Bar', file: './test-progress-bar.js' },
  { name: 'Report Generator', file: './test-report-generator.js' }
]

console.log(chalk.bold.cyan('═'.repeat(60)))
console.log(chalk.bold.cyan('Phase 7A: CLI Foundation - Test Suite'))
console.log(chalk.bold.cyan('═'.repeat(60)))
console.log()

let passed = 0
let failed = 0

for (const test of tests) {
  console.log(chalk.bold(`\n▶ Running: ${test.name}`))
  console.log(chalk.dim('─'.repeat(60)))

  try {
    // Dynamic import and run
    await import(test.file)
    console.log(chalk.green(`✓ ${test.name} passed`))
    passed++
  } catch (err) {
    console.error(chalk.red(`✗ ${test.name} failed: ${err.message}`))
    failed++
  }

  console.log()
}

// Note about interactive test
console.log(chalk.yellow('\n⚠ Note: Prompt Helpers test (test-prompt-helpers.js) requires manual interaction'))
console.log(chalk.dim('Run separately: node test-prompt-helpers.js'))

// Summary
console.log(chalk.bold.cyan('\n' + '═'.repeat(60)))
console.log(chalk.bold.cyan('Test Summary'))
console.log(chalk.bold.cyan('═'.repeat(60)))
console.log(chalk.green(`✓ Passed: ${passed}`))
if (failed > 0) {
  console.log(chalk.red(`✗ Failed: ${failed}`))
}
console.log(chalk.bold.cyan('═'.repeat(60)))

if (failed === 0) {
  console.log(chalk.green.bold('\n🎉 All automated tests passed!'))
  console.log(chalk.dim('Ready to proceed to Phase 7B\n'))
  process.exit(0)
} else {
  console.log(chalk.red.bold('\n❌ Some tests failed'))
  process.exit(1)
}

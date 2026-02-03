import {
  promptForConfirmation,
  promptForChoice,
  displaySuccess,
  displayError,
  displayInfo,
  displayWarning,
  displayHeader
} from './shared/prompt-helpers.js'

console.log('Testing Prompt Helpers...\n')

try {
  // Test 1: Display functions (non-interactive)
  displayHeader('Test Header')
  displaySuccess('This is a success message')
  displayError('This is an error message')
  displayInfo('This is an info message')
  displayWarning('This is a warning message')

  // Test 2: Interactive confirmation
  console.log('\n--- Interactive Tests ---')
  const confirmed = await promptForConfirmation('Continue with tests?', true)
  console.log(`User confirmed: ${confirmed}`)

  if (confirmed) {
    // Test 3: Choice selection
    const choice = await promptForChoice('Select a color:', [
      { name: 'Red', value: 'red' },
      { name: 'Green', value: 'green' },
      { name: 'Blue', value: 'blue' }
    ])
    console.log(`Selected: ${choice}`)
    displaySuccess(`You selected: ${choice}`)
  }

  console.log('\n✓ Prompt Helpers tests complete')
} catch (err) {
  console.error(`✗ Error: ${err.message}`)
}

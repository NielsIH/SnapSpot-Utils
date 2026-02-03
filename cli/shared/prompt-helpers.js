/**
 * Prompt Helpers - User input and interaction utilities
 *
 * Provides functions for interactive CLI prompts with validation.
 * Uses inquirer for consistent user experience.
 *
 * @module cli/shared/prompt-helpers
 */

import inquirer from 'inquirer'
import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'

/**
 * Prompt for file path with validation
 *
 * @param {string} message - Prompt message
 * @param {Object} options - Prompt options
 * @param {Function} [options.validate] - Custom validation function
 * @param {boolean} [options.mustExist=true] - File must exist
 * @param {string[]} [options.allowedExtensions] - Allowed file extensions
 * @returns {Promise<string>} Selected file path
 *
 * @example
 * const exportPath = await promptForFile('Select export file:', {
 *   allowedExtensions: ['.json']
 * })
 */
export async function promptForFile (message, options = {}) {
  const {
    validate: customValidate,
    mustExist = true,
    allowedExtensions = []
  } = options

  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'filePath',
      message,
      validate: async (input) => {
        if (!input.trim()) {
          return 'File path is required'
        }

        const fullPath = path.resolve(input)

        // Check existence
        if (mustExist) {
          try {
            await fs.access(fullPath)
          } catch {
            return `File not found: ${fullPath}`
          }
        }

        // Check extension
        if (allowedExtensions.length > 0) {
          const ext = path.extname(fullPath).toLowerCase()
          if (!allowedExtensions.includes(ext)) {
            return `File must have extension: ${allowedExtensions.join(', ')}`
          }
        }

        // Custom validation
        if (customValidate) {
          const result = await customValidate(fullPath)
          if (result !== true) {
            return result
          }
        }

        return true
      }
    }
  ])

  return path.resolve(answer.filePath)
}

/**
 * Prompt for directory path
 *
 * @param {string} message - Prompt message
 * @param {Object} options - Prompt options
 * @param {boolean} [options.mustExist=false] - Directory must exist
 * @param {boolean} [options.createIfNotExists=false] - Create if doesn't exist
 * @returns {Promise<string>} Selected directory path
 *
 * @example
 * const outputDir = await promptForDirectory('Select output directory:', {
 *   createIfNotExists: true
 * })
 */
export async function promptForDirectory (message, options = {}) {
  const {
    mustExist = false,
    createIfNotExists = false
  } = options

  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'dirPath',
      message,
      validate: async (input) => {
        if (!input.trim()) {
          return 'Directory path is required'
        }

        const fullPath = path.resolve(input)

        try {
          const stats = await fs.stat(fullPath)
          if (!stats.isDirectory()) {
            return 'Path exists but is not a directory'
          }
        } catch {
          if (mustExist && !createIfNotExists) {
            return `Directory not found: ${fullPath}`
          }
        }

        return true
      }
    }
  ])

  const fullPath = path.resolve(answer.dirPath)

  // Create directory if requested
  if (createIfNotExists) {
    await fs.mkdir(fullPath, { recursive: true })
  }

  return fullPath
}

/**
 * Prompt for confirmation (yes/no)
 *
 * @param {string} message - Prompt message
 * @param {boolean} [defaultValue=false] - Default value
 * @returns {Promise<boolean>} True if confirmed
 *
 * @example
 * const confirmed = await promptForConfirmation('Delete all photos?', false)
 * if (confirmed) {
 *   // Proceed with deletion
 * }
 */
export async function promptForConfirmation (message, defaultValue = false) {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue
    }
  ])

  return answer.confirmed
}

/**
 * Prompt for single choice from list
 *
 * @param {string} message - Prompt message
 * @param {Array} choices - Array of choices (strings or objects)
 * @param {Object} options - Prompt options
 * @param {*} [options.default] - Default selected value
 * @returns {Promise<*>} Selected choice value
 *
 * @example
 * const scheme = await promptForChoice('Select organization scheme:', [
 *   { name: 'By Map', value: 'by-map' },
 *   { name: 'By Marker', value: 'by-marker' }
 * ])
 */
export async function promptForChoice (message, choices, options = {}) {
  const { default: defaultValue } = options

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message,
      choices,
      default: defaultValue
    }
  ])

  return answer.choice
}

/**
 * Prompt for multiple file paths
 *
 * @param {string} message - Prompt message
 * @returns {Promise<string[]>} Array of file paths
 *
 * @example
 * const files = await promptForMultipleFiles('Enter export files (comma-separated):')
 * // Returns: ['file1.json', 'file2.json', ...]
 */
export async function promptForMultipleFiles (message) {
  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'files',
      message,
      validate: (input) => {
        if (!input.trim()) {
          return 'At least one file path is required'
        }
        return true
      }
    }
  ])

  // Split by comma and resolve paths
  return answer.files
    .split(',')
    .map(f => path.resolve(f.trim()))
    .filter(f => f.length > 0)
}

/**
 * Prompt for transformation selection
 *
 * @param {Array} availableTransformations - Available transformations
 * @returns {Promise<string[]>} Selected transformation names
 *
 * @example
 * const transformations = [
 *   { name: 'Remove Photos', value: 'removePhotos', description: 'Strip all photo data' },
 *   { name: 'Rename Map', value: 'renameMap', description: 'Change map name' }
 * ]
 * const selected = await promptForTransformation(transformations)
 */
export async function promptForTransformation (availableTransformations) {
  const answer = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'transformations',
      message: 'Select transformations to apply:',
      choices: availableTransformations.map(t => ({
        name: `${t.name} - ${t.description}`,
        value: t.value,
        checked: false
      }))
    }
  ])

  return answer.transformations
}

/**
 * Display colored success message
 *
 * @param {string} message - Message to display
 *
 * @example
 * displaySuccess('Export created successfully!')
 */
export function displaySuccess (message) {
  console.log(chalk.green('✓ ' + message))
}

/**
 * Display colored error message
 *
 * @param {string} message - Message to display
 *
 * @example
 * displayError('Failed to load export file')
 */
export function displayError (message) {
  console.error(chalk.red('✗ ' + message))
}

/**
 * Display colored info message
 *
 * @param {string} message - Message to display
 *
 * @example
 * displayInfo('Processing 100 files...')
 */
export function displayInfo (message) {
  console.log(chalk.blue('ℹ ' + message))
}

/**
 * Display colored warning message
 *
 * @param {string} message - Message to display
 *
 * @example
 * displayWarning('Some photos not found')
 */
export function displayWarning (message) {
  console.warn(chalk.yellow('⚠ ' + message))
}

/**
 * Display section header
 *
 * @param {string} title - Section title
 *
 * @example
 * displayHeader('Export Summary')
 */
export function displayHeader (title) {
  console.log('\n' + chalk.bold.cyan('═'.repeat(50)))
  console.log(chalk.bold.cyan(title))
  console.log(chalk.bold.cyan('═'.repeat(50)) + '\n')
}

/**
 * Prompt with autocomplete suggestions
 *
 * @param {string} message - Prompt message
 * @param {string[]} suggestions - Autocomplete suggestions
 * @returns {Promise<string>} User input
 *
 * @example
 * const filename = await promptWithSuggestions('Enter filename:', [
 *   'export-2026.json',
 *   'data.json'
 * ])
 */
export async function promptWithSuggestions (message, suggestions) {
  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'value',
      message,
      // Note: Full autocomplete requires additional inquirer plugin
      // This is a simplified version
      validate: (input) => input.trim().length > 0 || 'Input is required'
    }
  ])

  return answer.value
}

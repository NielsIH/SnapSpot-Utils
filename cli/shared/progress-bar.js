/**
 * Progress Bar - Terminal progress display utility
 *
 * Provides progress bars and status displays for long-running operations.
 * Uses cli-progress for consistent terminal output.
 *
 * @module cli/shared/progress-bar
 */

import cliProgress from 'cli-progress'
import chalk from 'chalk'

/**
 * Create a single progress bar
 *
 * @param {number} total - Total number of items
 * @param {Object} options - Progress bar options
 * @param {string} [options.format] - Custom format string
 * @param {string} [options.barCompleteChar='█'] - Character for completed portion
 * @param {string} [options.barIncompleteChar='░'] - Character for incomplete portion
 * @param {boolean} [options.hideCursor=true] - Hide terminal cursor during progress
 * @returns {Object} Progress bar instance
 *
 * @example
 * const bar = createProgressBar(100, {
 *   format: 'Processing {bar} {percentage}% | {value}/{total} files | {filename}'
 * })
 * bar.start()
 * bar.update(50, { filename: 'photo1.jpg' })
 * bar.complete()
 */
export function createProgressBar (total, options = {}) {
  const {
    format = 'Progress {bar} {percentage}% | {value}/{total} | ETA: {eta}s',
    barCompleteChar = '█',
    barIncompleteChar = '░',
    hideCursor = true
  } = options

  const bar = new cliProgress.SingleBar({
    format: format + ' | {metadata}',
    barCompleteChar,
    barIncompleteChar,
    hideCursor,
    clearOnComplete: false,
    stopOnComplete: true
  }, cliProgress.Presets.shades_classic)

  return {
    /**
     * Start progress bar
     */
    start () {
      bar.start(total, 0, { metadata: '' })
    },

    /**
     * Update progress
     *
     * @param {number} current - Current progress value
     * @param {Object} metadata - Additional metadata to display
     */
    update (current, metadata = {}) {
      const metaString = Object.entries(metadata)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ')
      bar.update(current, { metadata: metaString })
    },

    /**
     * Increment progress by 1
     *
     * @param {Object} metadata - Additional metadata to display
     */
    increment (metadata = {}) {
      const metaString = Object.entries(metadata)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ')
      bar.increment({ metadata: metaString })
    },

    /**
     * Complete progress bar
     */
    complete () {
      bar.stop()
    },

    /**
     * Stop progress bar (alias for complete)
     */
    stop () {
      bar.stop()
    }
  }
}

/**
 * Create a multi-bar progress display
 *
 * @param {Object} options - Multi-bar options
 * @returns {Object} Multi-bar instance
 *
 * @example
 * const multi = createMultiBar()
 * const bar1 = multi.create(100, 'Files')
 * const bar2 = multi.create(50, 'Photos')
 * bar1.update(50)
 * bar2.update(25)
 * multi.stop()
 */
export function createMultiBar (options = {}) {
  const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: '{name} {bar} {percentage}% | {value}/{total}'
  }, cliProgress.Presets.shades_classic)

  return {
    /**
     * Create a new progress bar
     *
     * @param {number} total - Total items
     * @param {string} name - Bar name/label
     * @returns {Object} Progress bar instance
     */
    create (total, name) {
      const bar = multibar.create(total, 0, { name })
      return {
        update (current) {
          bar.update(current)
        },
        increment () {
          bar.increment()
        },
        complete () {
          bar.stop()
        }
      }
    },

    /**
     * Stop all progress bars
     */
    stop () {
      multibar.stop()
    }
  }
}

/**
 * Display simple spinner for indeterminate operations
 *
 * @param {string} message - Status message
 * @returns {Object} Spinner instance
 *
 * @example
 * const spinner = displaySpinner('Loading exports...')
 * // ... do work ...
 * spinner.stop('Loaded successfully')
 */
export function displaySpinner (message) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let currentFrame = 0
  let interval = null

  const spinner = {
    /**
     * Start spinner
     */
    start () {
      process.stdout.write('\n')
      interval = setInterval(() => {
        process.stdout.write(`\r${chalk.cyan(frames[currentFrame])} ${message}`)
        currentFrame = (currentFrame + 1) % frames.length
      }, 80)
    },

    /**
     * Stop spinner and display final message
     *
     * @param {string} finalMessage - Final message to display
     * @param {boolean} success - Whether operation succeeded
     */
    stop (finalMessage = '', success = true) {
      if (interval) {
        clearInterval(interval)
        interval = null
      }

      const icon = success ? chalk.green('✓') : chalk.red('✗')
      const msg = finalMessage || message

      process.stdout.write(`\r${icon} ${msg}\n`)
    },

    /**
     * Update spinner message
     *
     * @param {string} newMessage - New message
     */
    updateMessage (newMessage) {
      message = newMessage
    }
  }

  spinner.start()
  return spinner
}

/**
 * Display simple progress percentage (no bar)
 *
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @param {string} label - Optional label
 *
 * @example
 * displayPercentage(50, 100, 'Files processed')
 * // Output: Files processed: 50/100 (50%)
 */
export function displayPercentage (current, total, label = 'Progress') {
  const percentage = ((current / total) * 100).toFixed(1)
  console.log(`${label}: ${current}/${total} (${percentage}%)`)
}

/**
 * Create a simple text-based progress tracker
 *
 * @param {number} total - Total items
 * @param {Object} options - Tracker options
 * @param {number} [options.updateInterval=10] - Update every N items
 * @returns {Object} Progress tracker
 *
 * @example
 * const tracker = createSimpleTracker(1000, { updateInterval: 100 })
 * for (let i = 0; i < 1000; i++) {
 *   tracker.increment()
 * }
 * tracker.complete()
 */
export function createSimpleTracker (total, options = {}) {
  const { updateInterval = 10 } = options
  let current = 0

  return {
    /**
     * Increment counter
     */
    increment () {
      current++
      if (current % updateInterval === 0 || current === total) {
        const percentage = ((current / total) * 100).toFixed(1)
        console.log(`Progress: ${current}/${total} (${percentage}%)`)
      }
    },

    /**
     * Complete tracker
     */
    complete () {
      console.log(chalk.green(`✓ Complete: ${current}/${total} (100%)`))
    }
  }
}

/**
 * Format duration in human-readable format
 *
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration
 *
 * @example
 * formatDuration(125000)
 * // Returns: '2m 5s'
 */
export function formatDuration (milliseconds) {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Create a timed operation wrapper
 *
 * @param {string} operationName - Name of operation
 * @param {Function} operation - Async operation to run
 * @returns {Promise<*>} Operation result
 *
 * @example
 * await timedOperation('Loading exports', async () => {
 *   return await loadExportFile('./data.json')
 * })
 * // Output: Loading exports... Done in 1.2s
 */
export async function timedOperation (operationName, operation) {
  const spinner = displaySpinner(operationName)
  const startTime = Date.now()

  try {
    const result = await operation()
    const duration = Date.now() - startTime
    spinner.stop(`${operationName} - Done in ${formatDuration(duration)}`, true)
    return result
  } catch (err) {
    spinner.stop(`${operationName} - Failed`, false)
    throw err
  }
}

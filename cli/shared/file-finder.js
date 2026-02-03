/**
 * File Finder - Recursive file search utility
 *
 * Provides functions for finding files by name or pattern across directory trees.
 * Handles symlinks, permissions errors, and excludes system directories by default.
 *
 * @module cli/shared/file-finder
 */

import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'

/**
 * Default directories to exclude from search
 */
const DEFAULT_EXCLUDES = [
  'node_modules',
  '.git',
  '.vscode',
  '.idea',
  '$RECYCLE.BIN',
  'System Volume Information',
  '.Trash',
  '.DS_Store'
]

/**
 * Find files by exact filename (case-insensitive)
 *
 * @param {string} searchPath - Root directory to search
 * @param {string|string[]} filenames - Filename(s) to search for
 * @param {Object} options - Search options
 * @param {string[]} [options.exclude=[]] - Additional patterns to exclude
 * @param {number} [options.maxDepth=Infinity] - Maximum directory depth
 * @param {boolean} [options.relativePaths=false] - Return relative instead of absolute paths
 * @param {Function} [options.onProgress] - Progress callback: (current, total) => void
 * @returns {Promise<string[]>} Array of file paths
 *
 * @example
 * const photos = await findFilesByName('/photos', ['photo1.jpg', 'photo2.jpg'])
 * // Returns: ['/photos/folder1/photo1.jpg', '/photos/folder2/photo2.jpg']
 *
 * @example
 * const results = await findFilesByName('/photos', 'photo.jpg', {
 *   maxDepth: 3,
 *   relativePaths: true,
 *   onProgress: (current, total) => console.log(`${current}/${total}`)
 * })
 */
export async function findFilesByName (searchPath, filenames, options = {}) {
  const {
    exclude = [],
    maxDepth = Infinity,
    relativePaths = false,
    onProgress = null
  } = options

  // Normalize inputs
  const fileSet = new Set(
    (Array.isArray(filenames) ? filenames : [filenames])
      .map(f => f.toLowerCase())
  )
  const excludeSet = new Set([...DEFAULT_EXCLUDES, ...exclude])

  const results = []
  let filesProcessed = 0

  /**
   * Recursively search directory
   */
  async function searchDir (dirPath, depth = 0) {
    if (depth > maxDepth) return

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        // Skip excluded directories
        if (entry.isDirectory() && excludeSet.has(entry.name)) {
          continue
        }

        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          // Recurse into subdirectory
          await searchDir(fullPath, depth + 1)
        } else if (entry.isFile()) {
          filesProcessed++

          // Check if filename matches (case-insensitive)
          if (fileSet.has(entry.name.toLowerCase())) {
            const resultPath = relativePaths
              ? path.relative(searchPath, fullPath)
              : fullPath

            results.push(resultPath)
          }

          // Report progress
          if (onProgress && filesProcessed % 100 === 0) {
            onProgress(filesProcessed, -1) // Total unknown
          }
        }
      }
    } catch (err) {
      // Handle permission errors gracefully
      if (err.code !== 'EACCES' && err.code !== 'EPERM') {
        console.warn(`Warning: Error reading ${dirPath}: ${err.message}`)
      }
    }
  }

  await searchDir(searchPath)

  // Final progress update
  if (onProgress) {
    onProgress(filesProcessed, filesProcessed)
  }

  return results
}

/**
 * Find files by glob patterns
 *
 * @param {string} searchPath - Root directory to search
 * @param {string|string[]} patterns - Glob pattern(s) to match
 * @param {Object} options - Search options
 * @param {string[]} [options.exclude=[]] - Additional patterns to exclude
 * @param {boolean} [options.relativePaths=false] - Return relative instead of absolute paths
 * @returns {Promise<string[]>} Array of file paths
 *
 * @example
 * const jpgs = await findFilesByPattern('/photos', '**\/*.jpg')
 * // Returns: ['/photos/a.jpg', '/photos/sub/b.jpg', ...]
 *
 * @example
 * const images = await findFilesByPattern('/photos', ['**\/*.jpg', '**\/*.png'], {
 *   exclude: ['thumbnails/**']
 * })
 */
export async function findFilesByPattern (searchPath, patterns, options = {}) {
  const {
    exclude = [],
    relativePaths = false
  } = options

  // Normalize inputs
  const patternArray = Array.isArray(patterns) ? patterns : [patterns]
  const ignorePatterns = [...DEFAULT_EXCLUDES.map(d => `**/${d}/**`), ...exclude]

  const results = []

  for (const pattern of patternArray) {
    const matches = await glob(pattern, {
      cwd: searchPath,
      ignore: ignorePatterns,
      absolute: !relativePaths,
      nodir: true, // Only return files
      dot: false // Exclude hidden files
    })

    results.push(...matches)
  }

  // Remove duplicates
  return [...new Set(results)]
}

/**
 * Check if a path is accessible
 *
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if accessible
 *
 * @example
 * if (await isAccessible('/some/path')) {
 *   // Path exists and is accessible
 * }
 */
export async function isAccessible (filePath) {
  try {
    await fs.access(filePath, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Get file statistics safely
 *
 * @param {string} filePath - Path to file
 * @returns {Promise<Object|null>} File stats or null if inaccessible
 *
 * @example
 * const stats = await getFileStat('/photo.jpg')
 * if (stats) {
 *   console.log(`Size: ${stats.size} bytes`)
 * }
 */
export async function getFileStat (filePath) {
  try {
    return await fs.stat(filePath)
  } catch {
    return null
  }
}

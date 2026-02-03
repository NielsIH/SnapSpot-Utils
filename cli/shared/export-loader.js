/**
 * Export Loader - SnapSpot export file loader and validator
 *
 * Thin wrapper around lib/snapspot-data modules for CLI file operations.
 * ALL parsing and validation logic comes from shared libraries.
 *
 * @module cli/shared/export-loader
 */

import fs from 'fs/promises'
import path from 'path'
import { parseExport } from '../../lib/snapspot-data/parser.js'
import { validateExportFile } from '../../lib/snapspot-data/validator.js'

/**
 * Load and parse a SnapSpot export file
 *
 * @param {string} filePath - Path to export JSON file
 * @returns {Promise<Object>} Parsed export data
 * @returns {Object} return.map - Map data
 * @returns {Array} return.markers - Array of markers
 * @returns {Array} return.photos - Array of photos
 * @throws {Error} If file not found, invalid JSON, or validation fails
 *
 * @example
 * const { map, markers, photos } = await loadExportFile('./data.json')
 * console.log(`Loaded: ${map.name} with ${markers.length} markers`)
 */
export async function loadExportFile (filePath) {
  try {
    // Read file from disk (CLI-specific)
    const jsonString = await fs.readFile(filePath, 'utf-8')

    // Validate using shared library
    const isValid = await validateExportFile(jsonString)
    if (!isValid) {
      throw new Error(`Invalid export file: ${filePath}`)
    }

    // Parse using shared library
    return await parseExport(jsonString)
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`)
    }
    if (err instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${filePath}: ${err.message}`)
    }
    throw err
  }
}

/**
 * Load multiple export files with progress tracking
 *
 * @param {string[]} filePaths - Array of file paths
 * @param {Object} options - Load options
 * @param {Function} [options.onProgress] - Progress callback: (current, total) => void
 * @param {boolean} [options.skipInvalid=false] - Skip invalid files instead of throwing
 * @returns {Promise<Array>} Array of loaded exports with metadata
 *
 * @example
 * const exports = await loadMultipleExports(['a.json', 'b.json'], {
 *   onProgress: (i, total) => console.log(`${i}/${total}`),
 *   skipInvalid: true
 * })
 * // Returns: [{data, filePath, isValid}, ...]
 */
export async function loadMultipleExports (filePaths, options = {}) {
  const {
    onProgress = null,
    skipInvalid = false
  } = options

  const results = []
  const total = filePaths.length

  for (let i = 0; i < total; i++) {
    const filePath = filePaths[i]

    try {
      const data = await loadExportFile(filePath)
      results.push({
        filePath,
        data,
        isValid: true,
        error: null
      })
    } catch (err) {
      if (skipInvalid) {
        results.push({
          filePath,
          data: null,
          isValid: false,
          error: err.message
        })
      } else {
        throw err
      }
    }

    if (onProgress) {
      onProgress(i + 1, total)
    }
  }

  return results
}

/**
 * Get summary information from export data
 *
 * @param {Object} exportData - Parsed export data from loadExportFile()
 * @returns {Object} Summary information
 *
 * @example
 * const data = await loadExportFile('./data.json')
 * const summary = getExportSummary(data)
 * console.log(`Maps: ${summary.mapCount}`)
 * console.log(`Markers: ${summary.markerCount}`)
 * console.log(`Photos: ${summary.photoCount}`)
 * console.log(`Photo filenames: ${summary.photoFilenames.join(', ')}`)
 */
export function getExportSummary (exportData) {
  const { map, markers, photos } = exportData

  return {
    mapCount: map ? 1 : 0,
    mapName: map?.name || null,
    markerCount: markers.length,
    photoCount: photos.length,
    photoFilenames: photos.map(p => p.filename || 'unnamed'),
    hasEmbeddedPhotos: photos.some(p => p.imageData),
    totalMarkers: markers.length,
    markersWithPhotos: markers.filter(m => m.photoIds && m.photoIds.length > 0).length,
    createdDate: map?.createdDate || null,
    version: exportData.version || 'unknown'
  }
}

/**
 * Extract photo filenames from export file
 *
 * @param {string} filePath - Path to export JSON file
 * @returns {Promise<string[]>} Array of photo filenames
 *
 * @example
 * const filenames = await extractPhotoFilenames('./data.json')
 * // Returns: ['photo1.jpg', 'photo2.jpg', ...]
 */
export async function extractPhotoFilenames (filePath) {
  const data = await loadExportFile(filePath)
  return data.photos.map(p => p.filename || 'unnamed')
}

/**
 * Get file metadata without loading full export
 *
 * @param {string} filePath - Path to export JSON file
 * @returns {Promise<Object>} File metadata
 *
 * @example
 * const meta = await getFileMetadata('./data.json')
 * console.log(`Size: ${meta.sizeKB}KB, Modified: ${meta.modified}`)
 */
export async function getFileMetadata (filePath) {
  try {
    const stats = await fs.stat(filePath)

    return {
      path: filePath,
      name: path.basename(filePath),
      directory: path.dirname(filePath),
      sizeBytes: stats.size,
      sizeKB: Math.round(stats.size / 1024),
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      modified: stats.mtime,
      created: stats.birthtime
    }
  } catch (err) {
    throw new Error(`Failed to get metadata for ${filePath}: ${err.message}`)
  }
}

/**
 * Check if file is a valid SnapSpot export (without loading)
 *
 * @param {string} filePath - Path to export JSON file
 * @returns {Promise<boolean>} True if valid export
 *
 * @example
 * if (await isValidExport('./data.json')) {
 *   // Safe to load
 * }
 */
export async function isValidExport (filePath) {
  try {
    const jsonString = await fs.readFile(filePath, 'utf-8')
    return await validateExportFile(jsonString)
  } catch {
    return false
  }
}

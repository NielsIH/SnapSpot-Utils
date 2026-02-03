/**
 * Export Writer - SnapSpot export file writer
 *
 * Thin wrapper around lib/snapspot-data modules for CLI file operations.
 * ALL writing and validation logic comes from shared libraries.
 *
 * @module cli/shared/export-writer
 */

import fs from 'fs/promises'
import path from 'path'
import { buildExport } from '../../lib/snapspot-data/writer.js'
import { validateExportFile } from '../../lib/snapspot-data/validator.js'

/**
 * Write export data to JSON file
 *
 * @param {Object} exportData - Export data (map, markers, photos)
 * @param {string} filePath - Output file path
 * @param {Object} options - Write options
 * @param {boolean} [options.backup=false] - Create backup of existing file
 * @param {boolean} [options.prettyPrint=true] - Format JSON with indentation
 * @param {boolean} [options.validate=true] - Validate before writing
 * @returns {Promise<void>}
 * @throws {Error} If validation fails or write error occurs
 *
 * @example
 * await writeExportFile({ map, markers, photos }, './output.json', {
 *   backup: true,
 *   prettyPrint: true
 * })
 */
export async function writeExportFile (exportData, filePath, options = {}) {
  const {
    backup = false,
    prettyPrint = true,
    validate = true
  } = options

  // Build export using shared library
  const jsonString = await buildExport(
    exportData.map,
    exportData.markers,
    exportData.photos
  )

  // Validate using shared library
  if (validate) {
    const isValid = await validateExportFile(jsonString)
    if (!isValid) {
      throw new Error('Generated export failed validation')
    }
  }

  // Create backup if requested and file exists
  if (backup) {
    try {
      await fs.access(filePath)
      const backupPath = `${filePath}.backup.${Date.now()}`
      await fs.copyFile(filePath, backupPath)
    } catch (err) {
      // File doesn't exist, no backup needed
    }
  }

  // Format JSON
  const formatted = prettyPrint
    ? JSON.stringify(JSON.parse(jsonString), null, 2)
    : jsonString

  // Ensure directory exists
  const directory = path.dirname(filePath)
  await fs.mkdir(directory, { recursive: true })

  // Atomic write: write to temp file, then rename
  const tempPath = `${filePath}.tmp.${Date.now()}`
  try {
    await fs.writeFile(tempPath, formatted, 'utf-8')
    await fs.rename(tempPath, filePath)
  } catch (err) {
    // Clean up temp file on error
    try {
      await fs.unlink(tempPath)
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to write ${filePath}: ${err.message}`)
  }
}

/**
 * Modify export data with transformations
 *
 * @param {Object} exportData - Export data to modify
 * @param {Object} modifications - Modifications to apply
 * @returns {Object} Modified export data (new object)
 *
 * @example
 * const modified = modifyExport(data, {
 *   removePhotos: true,
 *   renameMap: 'New Map Name',
 *   updateMarkerDescriptions: (desc) => desc.toUpperCase()
 * })
 */
export function modifyExport (exportData, modifications) {
  // Deep clone to avoid mutating original
  const modified = JSON.parse(JSON.stringify(exportData))

  // Apply modifications
  if (modifications.removePhotos) {
    modified.photos = []
    modified.markers.forEach(m => { m.photoIds = [] })
  }

  if (modifications.renameMap) {
    modified.map.name = modifications.renameMap
  }

  if (modifications.updateMarkerDescriptions) {
    modified.markers.forEach(m => {
      m.description = modifications.updateMarkerDescriptions(m.description)
    })
  }

  if (modifications.setMetadata) {
    Object.assign(modified.map, modifications.setMetadata)
  }

  return modified
}

/**
 * Remove all photos from export
 *
 * @param {Object} exportData - Export data
 * @returns {Object} Modified export data (new object)
 *
 * @example
 * const withoutPhotos = removePhotos(data)
 * // Photos array is empty, photoIds arrays are empty
 */
export function removePhotos (exportData) {
  return modifyExport(exportData, { removePhotos: true })
}

/**
 * Rename map in export
 *
 * @param {Object} exportData - Export data
 * @param {string} newName - New map name
 * @returns {Object} Modified export data (new object)
 *
 * @example
 * const renamed = renameMap(data, 'Updated Map Name')
 */
export function renameMap (exportData, newName) {
  return modifyExport(exportData, { renameMap: newName })
}

/**
 * Update marker descriptions using transform function
 *
 * @param {Object} exportData - Export data
 * @param {Function} transformFn - Function to transform description
 * @returns {Object} Modified export data (new object)
 *
 * @example
 * const updated = updateMarkerDescriptions(data, (desc) => `[UPDATED] ${desc}`)
 */
export function updateMarkerDescriptions (exportData, transformFn) {
  return modifyExport(exportData, { updateMarkerDescriptions: transformFn })
}

/**
 * Set custom metadata on map
 *
 * @param {Object} exportData - Export data
 * @param {Object} metadata - Key-value pairs to add
 * @returns {Object} Modified export data (new object)
 *
 * @example
 * const withMeta = setCustomMetadata(data, {
 *   project: 'Field Survey 2026',
 *   author: 'John Doe'
 * })
 */
export function setCustomMetadata (exportData, metadata) {
  return modifyExport(exportData, { setMetadata: metadata })
}

/**
 * Extract photo data from export (for saving to separate files)
 *
 * @param {Object} exportData - Export data
 * @returns {Array} Array of {filename, imageData, imageHash, markerId}
 *
 * @example
 * const photoData = extractPhotoData(data)
 * for (const photo of photoData) {
 *   await savePhotoToFile(photo.filename, photo.imageData)
 * }
 */
export function extractPhotoData (exportData) {
  return exportData.photos.map(photo => ({
    filename: photo.filename || 'unnamed.jpg',
    imageData: photo.imageData,
    imageHash: photo.imageHash,
    markerId: photo.markerId,
    createdDate: photo.createdDate
  }))
}

/**
 * Create directory structure for organized exports
 *
 * @param {string} basePath - Base directory path
 * @param {string[]} subdirectories - Subdirectories to create
 * @returns {Promise<void>}
 *
 * @example
 * await createDirectoryStructure('./output', ['maps', 'markers', 'photos'])
 * // Creates: ./output/maps, ./output/markers, ./output/photos
 */
export async function createDirectoryStructure (basePath, subdirectories) {
  await fs.mkdir(basePath, { recursive: true })

  for (const subdir of subdirectories) {
    const fullPath = path.join(basePath, subdir)
    await fs.mkdir(fullPath, { recursive: true })
  }
}

/**
 * Get backup file path for atomic writes
 *
 * @param {string} filePath - Original file path
 * @returns {string} Backup file path with timestamp
 *
 * @example
 * const backupPath = getBackupPath('./data.json')
 * // Returns: './data.json.backup.1707012345678'
 */
export function getBackupPath (filePath) {
  return `${filePath}.backup.${Date.now()}`
}

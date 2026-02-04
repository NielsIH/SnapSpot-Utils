/**
 * Configuration Manager
 * Manages user configuration stored in browser localStorage
 * Shared across all SnapSpot utilities
 */

/* global localStorage */

const CONFIG_KEY = 'snapspot-utils-config'

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  paths: {
    exportsDir: '',
    photosDir: '',
    outputDir: './output',
    organizerDir: ''
  },
  lastUpdated: null
}

/**
 * Get the complete configuration from localStorage
 * @returns {Object} Configuration object
 */
export function getConfig () {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) {
      const config = JSON.parse(stored)
      // Merge with defaults to handle new config keys
      return {
        ...DEFAULT_CONFIG,
        ...config,
        paths: {
          ...DEFAULT_CONFIG.paths,
          ...(config.paths || {})
        }
      }
    }
  } catch (err) {
    console.error('Error reading config from localStorage:', err)
  }
  return { ...DEFAULT_CONFIG }
}

/**
 * Save the complete configuration to localStorage
 * @param {Object} config - Configuration object to save
 */
export function saveConfig (config) {
  try {
    const configToSave = {
      ...config,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(configToSave))
    return true
  } catch (err) {
    console.error('Error saving config to localStorage:', err)
    return false
  }
}

/**
 * Get a specific path from configuration
 * @param {string} pathKey - Key of the path (exportsDir, photosDir, outputDir, organizerDir)
 * @returns {string} Path value or empty string
 */
export function getPath (pathKey) {
  const config = getConfig()
  return config.paths[pathKey] || ''
}

/**
 * Set a specific path in configuration
 * @param {string} pathKey - Key of the path
 * @param {string} pathValue - Path value to save
 */
export function setPath (pathKey, pathValue) {
  const config = getConfig()
  config.paths[pathKey] = pathValue
  return saveConfig(config)
}

/**
 * Get all paths from configuration
 * @returns {Object} Object containing all paths
 */
export function getPaths () {
  const config = getConfig()
  return { ...config.paths }
}

/**
 * Set multiple paths at once
 * @param {Object} paths - Object containing path keys and values
 */
export function setPaths (paths) {
  const config = getConfig()
  config.paths = {
    ...config.paths,
    ...paths
  }
  return saveConfig(config)
}

/**
 * Reset configuration to defaults
 */
export function resetConfig () {
  return saveConfig({ ...DEFAULT_CONFIG })
}

/**
 * Export configuration as JSON string
 * @returns {string} JSON string of configuration
 */
export function exportConfig () {
  const config = getConfig()
  return JSON.stringify(config, null, 2)
}

/**
 * Import configuration from JSON string
 * @param {string} jsonString - JSON string of configuration
 * @returns {boolean} Success status
 */
export function importConfig (jsonString) {
  try {
    const config = JSON.parse(jsonString)
    return saveConfig(config)
  } catch (err) {
    console.error('Error importing config:', err)
    return false
  }
}

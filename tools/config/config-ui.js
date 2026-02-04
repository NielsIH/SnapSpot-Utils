/**
 * Configuration UI Controller
 * Handles user interactions for the configuration page
 */

/* global alert, confirm, localStorage */

import {
  getConfig,
  saveConfig,
  resetConfig,
  exportConfig,
  importConfig
} from '../../shared/utils/config-manager.js'

class ConfigUI {
  constructor () {
    this.initElements()
    this.loadConfiguration()
    this.attachEventListeners()
    this.updateStatus()
  }

  initElements () {
    // Path inputs
    this.exportsDirInput = document.getElementById('exports-dir')
    this.photosDirInput = document.getElementById('photos-dir')
    this.outputDirInput = document.getElementById('output-dir')
    this.organizerDirInput = document.getElementById('organizer-dir')

    // Browse buttons
    this.browseExportsBtn = document.getElementById('browse-exports-btn')
    this.browsePhotosBtn = document.getElementById('browse-photos-btn')
    this.browseOutputBtn = document.getElementById('browse-output-btn')
    this.browseOrganizerBtn = document.getElementById('browse-organizer-btn')

    // Action buttons
    this.saveBtn = document.getElementById('save-btn')
    this.resetBtn = document.getElementById('reset-btn')
    this.exportBtn = document.getElementById('export-btn')
    this.importBtn = document.getElementById('import-btn')
    this.importFile = document.getElementById('import-file')

    // Status elements
    this.saveMessage = document.getElementById('save-message')
    this.lastUpdated = document.getElementById('last-updated')
    this.storageStatus = document.getElementById('storage-status')
  }

  attachEventListeners () {
    // Browse buttons
    this.browseExportsBtn.addEventListener('click', () => this.showBrowseHelp('exports'))
    this.browsePhotosBtn.addEventListener('click', () => this.showBrowseHelp('photos'))
    this.browseOutputBtn.addEventListener('click', () => this.showBrowseHelp('output'))
    this.browseOrganizerBtn.addEventListener('click', () => this.showBrowseHelp('organizer'))

    // Action buttons
    this.saveBtn.addEventListener('click', () => this.handleSave())
    this.resetBtn.addEventListener('click', () => this.handleReset())
    this.exportBtn.addEventListener('click', () => this.handleExport())
    this.importBtn.addEventListener('click', () => this.importFile.click())
    this.importFile.addEventListener('change', () => this.handleImport())

    // Auto-save on input (with debounce)
    const inputs = [
      this.exportsDirInput,
      this.photosDirInput,
      this.outputDirInput,
      this.organizerDirInput
    ]

    inputs.forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(this.autoSaveTimer)
        this.autoSaveTimer = setTimeout(() => this.handleSave(true), 1000)
      })
    })
  }

  loadConfiguration () {
    const config = getConfig()

    this.exportsDirInput.value = config.paths.exportsDir || ''
    this.photosDirInput.value = config.paths.photosDir || ''
    this.outputDirInput.value = config.paths.outputDir || ''
    this.organizerDirInput.value = config.paths.organizerDir || ''

    this.updateLastUpdated(config.lastUpdated)
  }

  handleSave (isAutoSave = false) {
    const paths = {
      exportsDir: this.exportsDirInput.value.trim(),
      photosDir: this.photosDirInput.value.trim(),
      outputDir: this.outputDirInput.value.trim(),
      organizerDir: this.organizerDirInput.value.trim()
    }

    const config = getConfig()
    config.paths = paths

    const success = saveConfig(config)

    if (success) {
      this.updateLastUpdated(config.lastUpdated)
      this.showMessage(isAutoSave ? 'Auto-saved ✓' : 'Configuration saved successfully! ✓', 'success')

      if (!isAutoSave) {
        // Scroll to top to show message
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else {
      this.showMessage('Failed to save configuration. Check browser console for details.', 'error')
    }
  }

  handleReset () {
    if (confirm('Are you sure you want to reset all configuration to defaults? This cannot be undone.')) {
      resetConfig()
      this.loadConfiguration()
      this.showMessage('Configuration reset to defaults.', 'info')
    }
  }

  handleExport () {
    const configJson = exportConfig()

    // Create downloadable file
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snapspot-utils-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    this.showMessage('Configuration exported successfully! Check your downloads.', 'success')
  }

  async handleImport () {
    const file = this.importFile.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const success = importConfig(text)

      if (success) {
        this.loadConfiguration()
        this.showMessage('Configuration imported successfully!', 'success')
      } else {
        this.showMessage('Failed to import configuration. Invalid file format.', 'error')
      }
    } catch (err) {
      console.error('Error importing config:', err)
      this.showMessage('Failed to import configuration. Check browser console for details.', 'error')
    }

    // Reset file input
    this.importFile.value = ''
  }

  showBrowseHelp (type) {
    const messages = {
      exports: 'To find your SnapSpot Exports directory:\n\n1. Open File Explorer\n2. Navigate to where you save SnapSpot export files\n3. Click the address bar at the top\n4. Copy the full path (Ctrl+C)\n5. Paste it in the field above\n\nExample: C:\\Users\\YourName\\Documents\\SnapSpot\\Exports',
      photos: 'To find your Photos directory:\n\n1. Open File Explorer\n2. Navigate to where you store your photos\n3. Click the address bar at the top\n4. Copy the full path (Ctrl+C)\n5. Paste it in the field above\n\nExample: C:\\Photos or D:\\Pictures\\Field-Photos',
      output: 'To find your Output directory:\n\n1. Open File Explorer\n2. Navigate to where you want reports saved\n3. Click the address bar at the top\n4. Copy the full path (Ctrl+C)\n5. Paste it in the field above\n\nExample: C:\\SnapSpot-Output',
      organizer: 'To find your Organizer directory:\n\n1. Open File Explorer\n2. Navigate to where you want organized photos saved\n3. Click the address bar at the top\n4. Copy the full path (Ctrl+C)\n5. Paste it in the field above\n\nExample: C:\\Organized-Photos'
    }

    alert(messages[type] || 'Please enter the full directory path.')
  }

  showMessage (text, type = 'info') {
    this.saveMessage.textContent = text
    this.saveMessage.className = `message message-${type}`
    this.saveMessage.style.display = 'block'

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.saveMessage.style.display = 'none'
    }, 5000)
  }

  updateLastUpdated (timestamp) {
    if (timestamp) {
      const date = new Date(timestamp)
      this.lastUpdated.textContent = date.toLocaleString()
    } else {
      this.lastUpdated.textContent = 'Never'
    }
  }

  updateStatus () {
    // Check localStorage availability and size
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)

      // Estimate storage usage
      let total = 0
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += localStorage[key].length + key.length
        }
      }

      const kb = (total / 1024).toFixed(2)
      this.storageStatus.textContent = `Available (${kb} KB used)`
      this.storageStatus.classList.add('status-ok')
    } catch (err) {
      this.storageStatus.textContent = 'Not Available'
      this.storageStatus.classList.add('status-error')
    }
  }
}

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const ui = new ConfigUI()
  return ui
})

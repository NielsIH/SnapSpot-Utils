/**
 * Photo Finder UI Controller
 * Handles user interactions, command generation, and result viewing
 */

/* global alert */

import { getPaths } from '../../shared/utils/config-manager.js'

class PhotoFinderUI {
  constructor () {
    this.exportFilePath = ''
    this.photoDirPath = ''
    this.outputDirPath = ''
    this.reportFormat = 'html'
    this.saveLog = true
    this.maxDepth = ''
    this.caseSensitive = false

    this.initElements()
    this.loadSavedPaths()
    this.attachEventListeners()
  }

  initElements () {
    // Input elements
    this.exportFilePathInput = document.getElementById('export-file-path')
    this.exportFileInput = document.getElementById('export-file')
    this.browseExportBtn = document.getElementById('browse-export-btn')
    this.exportFileInfo = document.getElementById('export-file-info')

    this.photoDirPathInput = document.getElementById('photo-dir-path')
    this.photoDirInput = document.getElementById('photo-dir-input')
    this.browseDirBtn = document.getElementById('browse-dir-btn')

    this.outputDirInput = document.getElementById('output-dir')
    this.outputDirFileInput = document.getElementById('output-dir-input')
    this.browseOutputBtn = document.getElementById('browse-output-btn')

    // Option elements
    this.reportFormatSelect = document.getElementById('report-format')
    this.saveLogCheckbox = document.getElementById('save-log')
    this.maxDepthInput = document.getElementById('max-depth')
    this.caseSensitiveCheckbox = document.getElementById('case-sensitive')

    // Command elements
    this.generatedCommand = document.getElementById('generated-command')
    this.copyCommandBtn = document.getElementById('copy-command-btn')

    // Results elements
    this.tabBtns = document.querySelectorAll('.tab-btn')
    this.reportDropZone = document.getElementById('report-drop-zone')
    this.logDropZone = document.getElementById('log-drop-zone')
    this.reportFileInput = document.getElementById('report-file')
    this.logFileInput = document.getElementById('log-file')
    this.reportViewer = document.getElementById('report-viewer')
    this.logViewer = document.getElementById('log-viewer')
    this.reportFilename = document.getElementById('report-filename')
    this.logFilename = document.getElementById('log-filename')
    this.reportContent = document.getElementById('report-content')
    this.logContent = document.getElementById('log-content')
    this.closeReportBtn = document.getElementById('close-report')
    this.closeLogBtn = document.getElementById('close-log')
  }

  attachEventListeners () {
    // Path inputs
    this.exportFilePathInput.addEventListener('input', () => this.handleExportPathInput())
    this.photoDirPathInput.addEventListener('input', () => this.handlePhotoDirInput())
    this.outputDirInput.addEventListener('input', () => this.handleOutputDirInput())

    // Browse buttons
    this.browseExportBtn.addEventListener('click', () => this.exportFileInput.click())
    this.exportFileInput.addEventListener('change', () => this.handleExportFileBrowse())

    this.browseDirBtn.addEventListener('click', () => this.photoDirInput.click())
    this.photoDirInput.addEventListener('change', () => this.handlePhotoDirBrowse())

    this.browseOutputBtn.addEventListener('click', () => this.outputDirFileInput.click())
    this.outputDirFileInput.addEventListener('change', () => this.handleOutputDirBrowse())

    // Options
    this.reportFormatSelect.addEventListener('change', () => this.updateCommand())
    this.saveLogCheckbox.addEventListener('change', () => this.updateCommand())
    this.maxDepthInput.addEventListener('input', () => this.updateCommand())
    this.caseSensitiveCheckbox.addEventListener('change', () => this.updateCommand())

    // Command
    this.copyCommandBtn.addEventListener('click', () => this.copyCommand())

    // Results tabs
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab))
    })

    // File inputs for results
    this.reportFileInput.addEventListener('change', () => this.handleReportFileSelect())
    this.logFileInput.addEventListener('change', () => this.handleLogFileSelect())

    // Close buttons
    this.closeReportBtn.addEventListener('click', () => this.closeReportViewer())
    this.closeLogBtn.addEventListener('click', () => this.closeLogViewer())

    // Drag and drop
    this.setupDragAndDrop(this.reportDropZone, (file) => this.loadReportFile(file))
    this.setupDragAndDrop(this.logDropZone, (file) => this.loadLogFile(file))
  }

  loadSavedPaths () {
    // Load saved paths from configuration
    const paths = getPaths()

    // Pre-populate export file path from configured exports directory
    if (paths.exportsDir) {
      this.exportFilePathInput.value = paths.exportsDir
      this.exportFilePath = paths.exportsDir
      this.exportFileInfo.innerHTML = 'Configured base path loaded. <a href="../config/index.html" class="config-link">Change in Configuration →</a>'
    }

    // Pre-populate photo directory
    if (paths.photosDir) {
      this.photoDirPathInput.value = paths.photosDir
      this.photoDirPath = paths.photosDir
    }

    // Pre-populate output directory
    if (paths.outputDir) {
      this.outputDirInput.value = paths.outputDir
      this.outputDirPath = paths.outputDir
    }

    // Update command with loaded paths
    this.updateCommand()
  }

  handleExportPathInput () {
    this.exportFilePath = this.exportFilePathInput.value.trim()
    if (this.exportFilePath) {
      const filename = this.exportFilePath.split(/[\\/]/).pop()
      this.exportFileInfo.textContent = `✓ ${filename}`
      this.exportFileInfo.classList.add('file-selected')
    } else {
      this.exportFileInfo.textContent = 'Enter the full path to your SnapSpot export file'
      this.exportFileInfo.classList.remove('file-selected')
    }
    this.updateCommand()
  }

  handlePhotoDirInput () {
    this.photoDirPath = this.photoDirPathInput.value.trim()
    this.updateCommand()
  }

  handleOutputDirInput () {
    this.outputDirPath = this.outputDirInput.value.trim()
    this.updateCommand()
  }

  handleExportFileBrowse () {
    const file = this.exportFileInput.files[0]
    if (file) {
      // Get configured base path
      const paths = getPaths()
      const basePath = paths.exportsDir || ''

      // Append filename to base path
      if (basePath) {
        // Ensure base path ends with separator
        const separator = basePath.includes('/') ? '/' : '\\'
        const fullPath = basePath.endsWith(separator)
          ? basePath + file.name
          : basePath + separator + file.name

        this.exportFilePathInput.value = fullPath
        this.exportFilePath = fullPath
        this.exportFileInfo.textContent = `✓ ${file.name}`
        this.exportFileInfo.classList.add('file-selected')
      } else {
        // No base path configured - just show filename as hint
        this.exportFileInfo.innerHTML = `File selected: ${file.name}<br>Configure base path on <a href="../config/index.html" class="config-link">Configuration page</a> or enter full path manually`
        this.exportFileInfo.classList.add('file-selected')
      }

      this.updateCommand()
    }
  }

  handlePhotoDirBrowse () {
    const files = this.photoDirInput.files
    if (files.length > 0) {
      // Get the directory name from the first file's webkitRelativePath
      const firstFile = files[0]
      const relativePath = firstFile.webkitRelativePath || ''
      const folderName = relativePath.split('/')[0]

      if (folderName) {
        // Get configured base path
        const paths = getPaths()
        const basePath = paths.photosDir || ''

        // Append folder name to base path
        if (basePath) {
          const separator = basePath.includes('/') ? '/' : '\\'
          const fullPath = basePath.endsWith(separator)
            ? basePath + folderName
            : basePath + separator + folderName

          this.photoDirPathInput.value = fullPath
          this.photoDirPath = fullPath
        } else {
          // No base path - just set folder name
          this.photoDirPathInput.value = folderName
          this.photoDirPath = folderName
        }

        this.updateCommand()
      }
    }
  }

  handleOutputDirBrowse () {
    const files = this.outputDirFileInput.files
    if (files.length > 0) {
      const firstFile = files[0]
      const relativePath = firstFile.webkitRelativePath || ''
      const folderName = relativePath.split('/')[0]

      if (folderName) {
        const paths = getPaths()
        const basePath = paths.outputDir || ''

        if (basePath) {
          const separator = basePath.includes('/') ? '/' : '\\'
          const fullPath = basePath.endsWith(separator)
            ? basePath + folderName
            : basePath + separator + folderName

          this.outputDirInput.value = fullPath
          this.outputDirPath = fullPath
        } else {
          this.outputDirInput.value = folderName
          this.outputDirPath = folderName
        }

        this.updateCommand()
      }
    }
  }

  updateCommand () {
    // Get current values
    this.reportFormat = this.reportFormatSelect.value
    this.saveLog = this.saveLogCheckbox.checked
    this.maxDepth = this.maxDepthInput.value.trim()
    this.caseSensitive = this.caseSensitiveCheckbox.checked

    // Check if we have required inputs
    if (!this.exportFilePath || !this.photoDirPath) {
      this.generatedCommand.textContent = 'Enter the export file path and search directory path above to generate command...'
      this.copyCommandBtn.disabled = true
      return
    }

    // Build command with full paths
    const parts = ['node tools/photo-finder/photo-finder.js']

    // Export file path (use full path)
    parts.push(`--export "${this.exportFilePath}"`)

    // Search directory (use full path)
    parts.push(`--search "${this.photoDirPath}"`)

    // Output directory (CLI will auto-generate filenames based on map name)
    if (this.outputDirPath) {
      parts.push(`--output-dir "${this.outputDirPath}"`)
    }

    // Report format
    parts.push(`--format ${this.reportFormat}`)

    // Generate report (always, unless disabled)
    parts.push('--report')

    // Log file (optional)
    if (this.saveLog) {
      parts.push('--log')
    }

    // Max depth (optional)
    if (this.maxDepth) {
      parts.push(`--max-depth ${this.maxDepth}`)
    }

    // Case-sensitive (optional)
    if (this.caseSensitive) {
      parts.push('--case-sensitive')
    }

    // Detect Windows paths (backslashes) and use PowerShell syntax
    const isWindows = this.exportFilePath.includes('\\') || this.photoDirPath.includes('\\')
    const lineContinuation = isWindows ? ' `\n  ' : ' \\\n  '

    const command = parts.join(lineContinuation)
    this.generatedCommand.textContent = command
    this.copyCommandBtn.disabled = false
  }

  async copyCommand () {
    try {
      await navigator.clipboard.writeText(this.generatedCommand.textContent)

      // Visual feedback
      const originalText = this.copyCommandBtn.textContent
      this.copyCommandBtn.textContent = '✓ Copied!'
      setTimeout(() => {
        this.copyCommandBtn.textContent = originalText
      }, 2000)
    } catch (err) {
      console.error('Failed to copy command:', err)
      alert('Failed to copy command. Please copy manually.')
    }
  }

  switchTab (tab) {
    // Update tab buttons
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab)
    })

    // Show/hide drop zones
    if (tab === 'report') {
      this.reportDropZone.classList.remove('hidden')
      this.logDropZone.classList.add('hidden')
    } else {
      this.reportDropZone.classList.add('hidden')
      this.logDropZone.classList.remove('hidden')
    }
  }

  setupDragAndDrop (element, onFileDrop) {
    element.addEventListener('dragover', (e) => {
      e.preventDefault()
      element.classList.add('drag-over')
    })

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over')
    })

    element.addEventListener('drop', (e) => {
      e.preventDefault()
      element.classList.remove('drag-over')

      const file = e.dataTransfer.files[0]
      if (file) {
        onFileDrop(file)
      }
    })
  }

  handleReportFileSelect () {
    const file = this.reportFileInput.files[0]
    if (file) {
      this.loadReportFile(file)
    }
  }

  handleLogFileSelect () {
    const file = this.logFileInput.files[0]
    if (file) {
      this.loadLogFile(file)
    }
  }

  async loadReportFile (file) {
    try {
      const content = await file.text()
      const extension = file.name.split('.').pop().toLowerCase()

      this.reportFilename.textContent = file.name

      if (extension === 'html') {
        // Display HTML in iframe for safe rendering (don't escape - it's already HTML)
        const escapedContent = content.replace(/"/g, '&quot;')
        this.reportContent.innerHTML = `<iframe srcdoc="${escapedContent}" style="width: 100%; height: 600px; border: 1px solid #ddd;"></iframe>`
      } else if (extension === 'json') {
        // Pretty print JSON
        const json = JSON.parse(content)
        this.reportContent.innerHTML = `<pre>${JSON.stringify(json, null, 2)}</pre>`
      } else {
        // Plain text
        this.reportContent.innerHTML = `<pre>${this.escapeHtml(content)}</pre>`
      }

      this.reportDropZone.classList.add('hidden')
      this.reportViewer.classList.remove('hidden')
    } catch (err) {
      console.error('Error loading report file:', err)
      alert('Failed to load report file.')
    }
  }

  async loadLogFile (file) {
    try {
      const content = await file.text()

      this.logFilename.textContent = file.name
      this.logContent.textContent = content

      this.logDropZone.classList.add('hidden')
      this.logViewer.classList.remove('hidden')
    } catch (err) {
      console.error('Error loading log file:', err)
      alert('Failed to load log file.')
    }
  }

  closeReportViewer () {
    this.reportViewer.classList.add('hidden')
    this.reportDropZone.classList.remove('hidden')
    this.reportContent.innerHTML = ''
  }

  closeLogViewer () {
    this.logViewer.classList.add('hidden')
    this.logDropZone.classList.remove('hidden')
    this.logContent.textContent = ''
  }

  escapeHtml (text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const ui = new PhotoFinderUI()
  // Keep reference to avoid unused variable warning
  return ui
})

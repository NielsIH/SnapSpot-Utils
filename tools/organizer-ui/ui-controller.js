/**
 * Organizer UI Controller
 * Handles path inputs, option toggles, and command generation.
 */

/* global alert */

import { getPaths } from '../../shared/utils/config-manager.js'

class OrganizerUI {
  constructor () {
    this.exportFilePath = ''
    this.searchPaths = ''
    this.manifestFilePath = ''
    this.outputDirPath = ''

    this.initElements()
    this.loadSavedPaths()
    this.attachEventListeners()
  }

  initElements () {
    this.exportFilePathInput = document.getElementById('export-file-path')
    this.exportFileInput = document.getElementById('export-file')
    this.browseExportBtn = document.getElementById('browse-export-btn')
    this.exportFileInfo = document.getElementById('export-file-info')

    this.searchPathsInput = document.getElementById('search-paths')
    this.searchDirInput = document.getElementById('search-dir-input')
    this.browseSearchBtn = document.getElementById('browse-search-btn')

    this.inputModeSelect = document.getElementById('input-mode')
    this.searchGroup = document.getElementById('search-group')
    this.manifestGroup = document.getElementById('manifest-group')
    this.manifestFilePathInput = document.getElementById('manifest-file-path')
    this.manifestFileInput = document.getElementById('manifest-file-input')
    this.browseManifestBtn = document.getElementById('browse-manifest-btn')

    this.outputDirInput = document.getElementById('output-dir')
    this.outputDirFileInput = document.getElementById('output-dir-input')
    this.browseOutputBtn = document.getElementById('browse-output-btn')

    this.schemeSelect = document.getElementById('scheme')
    this.copyExportCheckbox = document.getElementById('copy-export')
    this.createIndexCheckbox = document.getElementById('create-index')
    this.missingOkCheckbox = document.getElementById('missing-ok')
    this.dryRunCheckbox = document.getElementById('dry-run')

    this.saveReportCheckbox = document.getElementById('save-report')
    this.reportOptions = document.getElementById('report-options')
    this.reportPathInput = document.getElementById('report-path')
    this.reportFormatSelect = document.getElementById('report-format')

    this.generatedCommand = document.getElementById('generated-command')
    this.copyCommandBtn = document.getElementById('copy-command-btn')
  }

  attachEventListeners () {
    this.exportFilePathInput.addEventListener('input', () => this.handleExportPathInput())
    this.searchPathsInput.addEventListener('input', () => this.handleSearchPathInput())
    this.manifestFilePathInput.addEventListener('input', () => this.handleManifestPathInput())
    this.outputDirInput.addEventListener('input', () => this.handleOutputDirInput())

    this.inputModeSelect.addEventListener('change', () => this.handleInputModeChange())

    this.browseExportBtn.addEventListener('click', () => this.exportFileInput.click())
    this.exportFileInput.addEventListener('change', () => this.handleExportFileBrowse())

    this.browseSearchBtn.addEventListener('click', () => this.searchDirInput.click())
    this.searchDirInput.addEventListener('change', () => this.handleSearchDirBrowse())

    this.browseManifestBtn.addEventListener('click', () => this.manifestFileInput.click())
    this.manifestFileInput.addEventListener('change', () => this.handleManifestFileBrowse())

    this.browseOutputBtn.addEventListener('click', () => this.outputDirFileInput.click())
    this.outputDirFileInput.addEventListener('change', () => this.handleOutputDirBrowse())

    this.schemeSelect.addEventListener('change', () => this.updateCommand())
    this.copyExportCheckbox.addEventListener('change', () => this.updateCommand())
    this.createIndexCheckbox.addEventListener('change', () => this.updateCommand())
    this.missingOkCheckbox.addEventListener('change', () => this.updateCommand())
    this.dryRunCheckbox.addEventListener('change', () => this.updateCommand())

    this.saveReportCheckbox.addEventListener('change', () => {
      this.toggleReportOptions()
      this.updateCommand()
    })

    this.reportPathInput.addEventListener('input', () => this.updateCommand())
    this.reportFormatSelect.addEventListener('change', () => {
      this.syncDefaultReportPathExt()
      this.updateCommand()
    })

    this.copyCommandBtn.addEventListener('click', () => this.copyCommand())
  }

  loadSavedPaths () {
    const paths = getPaths()

    if (paths.exportsDir) {
      this.exportFilePathInput.value = paths.exportsDir
      this.exportFilePath = paths.exportsDir
      this.exportFileInfo.innerHTML = 'Configured base path loaded. <a href="../config/index.html" class="config-link">Change in Configuration →</a>'
    }

    if (paths.photosDir) {
      this.searchPathsInput.value = paths.photosDir
      this.searchPaths = paths.photosDir
    }

    if (paths.organizerDir) {
      this.outputDirInput.value = paths.organizerDir
      this.outputDirPath = paths.organizerDir
    } else if (paths.outputDir) {
      this.outputDirInput.value = paths.outputDir
      this.outputDirPath = paths.outputDir
    }

    this.syncDefaultReportPathExt()
    this.handleInputModeChange()
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

  handleSearchPathInput () {
    this.searchPaths = this.searchPathsInput.value.trim()
    this.updateCommand()
  }

  handleManifestPathInput () {
    this.manifestFilePath = this.manifestFilePathInput.value.trim()
    this.updateCommand()
  }

  handleOutputDirInput () {
    this.outputDirPath = this.outputDirInput.value.trim()
    this.syncDefaultReportPathExt()
    this.updateCommand()
  }

  handleInputModeChange () {
    const mode = this.inputModeSelect.value
    const useManifest = mode === 'manifest'

    this.searchGroup.classList.toggle('hidden', useManifest)
    this.manifestGroup.classList.toggle('hidden', !useManifest)

    this.updateCommand()
  }

  handleExportFileBrowse () {
    const file = this.exportFileInput.files[0]
    if (!file) return

    const paths = getPaths()
    const basePath = paths.exportsDir || ''

    if (basePath) {
      const separator = basePath.includes('/') ? '/' : '\\'
      const fullPath = basePath.endsWith(separator)
        ? basePath + file.name
        : basePath + separator + file.name

      this.exportFilePathInput.value = fullPath
      this.exportFilePath = fullPath
      this.exportFileInfo.textContent = `✓ ${file.name}`
      this.exportFileInfo.classList.add('file-selected')
    } else {
      this.exportFileInfo.innerHTML = `File selected: ${file.name}<br>Configure base path on <a href="../config/index.html" class="config-link">Configuration page</a> or enter full path manually`
      this.exportFileInfo.classList.add('file-selected')
    }

    this.updateCommand()
  }

  handleSearchDirBrowse () {
    const files = this.searchDirInput.files
    if (!files.length) return

    const firstFile = files[0]
    const folderName = (firstFile.webkitRelativePath || '').split('/')[0]
    if (!folderName) return

    const paths = getPaths()
    const basePath = paths.photosDir || ''

    const selectedPath = basePath
      ? this.joinPath(basePath, folderName)
      : folderName

    const existing = this.searchPathsInput.value.trim()
    if (!existing) {
      this.searchPathsInput.value = selectedPath
    } else {
      const parts = existing.split(',').map((part) => part.trim()).filter(Boolean)
      if (!parts.includes(selectedPath)) {
        parts.push(selectedPath)
      }
      this.searchPathsInput.value = parts.join(',')
    }

    this.searchPaths = this.searchPathsInput.value.trim()
    this.updateCommand()
  }

  handleOutputDirBrowse () {
    const files = this.outputDirFileInput.files
    if (!files.length) return

    const firstFile = files[0]
    const folderName = (firstFile.webkitRelativePath || '').split('/')[0]
    if (!folderName) return

    const paths = getPaths()
    const basePath = paths.organizerDir || paths.outputDir || ''

    const fullPath = basePath
      ? this.joinPath(basePath, folderName)
      : folderName

    this.outputDirInput.value = fullPath
    this.outputDirPath = fullPath
    this.syncDefaultReportPathExt()
    this.updateCommand()
  }

  handleManifestFileBrowse () {
    const file = this.manifestFileInput.files[0]
    if (!file) return

    const paths = getPaths()
    const basePath = paths.outputDir || ''

    if (basePath) {
      const fullPath = this.joinPath(basePath, file.name)
      this.manifestFilePathInput.value = fullPath
      this.manifestFilePath = fullPath
    } else {
      this.manifestFilePathInput.value = file.name
      this.manifestFilePath = file.name
    }

    this.updateCommand()
  }

  joinPath (basePath, child) {
    const separator = basePath.includes('/') ? '/' : '\\'
    return basePath.endsWith(separator)
      ? basePath + child
      : basePath + separator + child
  }

  toggleReportOptions () {
    if (this.saveReportCheckbox.checked) {
      this.reportOptions.classList.remove('hidden')
      this.syncDefaultReportPathExt()
    } else {
      this.reportOptions.classList.add('hidden')
    }
  }

  syncDefaultReportPathExt () {
    if (!this.saveReportCheckbox.checked) return

    const selectedExt = this.reportFormatSelect.value
    const current = this.reportPathInput.value.trim()

    if (!current) {
      const baseDir = this.outputDirPath || '.'
      this.reportPathInput.value = `${baseDir}${baseDir.endsWith('\\') || baseDir.endsWith('/') ? '' : '\\'}organizer-report.${selectedExt}`
      return
    }

    this.reportPathInput.value = current.replace(/\.(txt|json|html)$/i, `.${selectedExt}`)
  }

  updateCommand () {
    const mode = this.inputModeSelect.value
    const hasPhotoInput = mode === 'manifest'
      ? Boolean(this.manifestFilePath)
      : Boolean(this.searchPaths)

    const requiredReady = this.exportFilePath && hasPhotoInput && this.outputDirPath
    if (!requiredReady) {
      this.generatedCommand.textContent = 'Fill required paths above to generate command...'
      this.copyCommandBtn.disabled = true
      return
    }

    const parts = ['node tools/organizer/organizer.js']

    parts.push(`--export "${this.exportFilePath}"`)

    if (mode === 'manifest') {
      parts.push(`--manifest "${this.manifestFilePath}"`)
    } else {
      parts.push(`--search "${this.searchPaths}"`)
    }

    parts.push(`--output "${this.outputDirPath}"`)
    parts.push(`--scheme ${this.schemeSelect.value}`)

    if (this.copyExportCheckbox.checked) parts.push('--copy-export')
    if (this.createIndexCheckbox.checked) parts.push('--create-index')
    if (this.missingOkCheckbox.checked) parts.push('--missing-ok')
    if (this.dryRunCheckbox.checked) parts.push('--dry-run')

    if (this.saveReportCheckbox.checked) {
      const reportPath = this.reportPathInput.value.trim()
      if (reportPath) {
        parts.push(`--report "${reportPath}"`)
      }
    }

    const isWindows = this.exportFilePath.includes('\\') || this.searchPaths.includes('\\') || this.manifestFilePath.includes('\\') || this.outputDirPath.includes('\\')
    const lineContinuation = isWindows ? ' `\n  ' : ' \\\n  '

    this.generatedCommand.textContent = parts.join(lineContinuation)
    this.copyCommandBtn.disabled = false
  }

  async copyCommand () {
    try {
      await navigator.clipboard.writeText(this.generatedCommand.textContent)

      const originalText = this.copyCommandBtn.textContent
      this.copyCommandBtn.textContent = '✓ Copied!'
      setTimeout(() => {
        this.copyCommandBtn.textContent = originalText
      }, 2000)
    } catch (error) {
      console.error('Failed to copy command:', error)
      alert('Failed to copy command. Please copy manually.')
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const ui = new OrganizerUI()
  return ui
})

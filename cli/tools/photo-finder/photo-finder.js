#!/usr/bin/env node

/**
 * Photo Finder - Find original photos referenced in SnapSpot exports
 *
 * Read-only validation tool that searches the file system for original
 * high-quality photos referenced in SnapSpot export files.
 *
 * Features:
 * - Searches for photos by filename across multiple directories
 * - Case-insensitive matching (IMG_1234.jpg vs img_1234.JPG)
 * - Tracks found/missing/duplicate photos
 * - Generates detailed reports and logs
 * - Does NOT copy or modify any files
 *
 * Usage:
 *   Interactive: photo-finder
 *   CLI: photo-finder --export data.json --search /photos --report report.html
 *
 * @module cli/tools/photo-finder
 */

import fs from 'fs/promises'
import path from 'path'
import { createInterface } from 'readline'
import { loadExportFile } from '../../shared/export-loader.js'
import { findFilesByName } from '../../shared/file-finder.js'
import {
  displaySuccess,
  displayError,
  displayInfo,
  displayWarning,
  displayHeader
} from '../../shared/prompt-helpers.js'
import {
  createProgressBar,
  formatDuration
} from '../../shared/progress-bar.js'
import {
  generateTextReport,
  generateJsonReport,
  generateHtmlReport,
  writeReportToFile
} from '../../shared/report-generator.js'

/**
 * Find photos for a SnapSpot export file
 *
 * @param {string} exportPath - Path to export JSON file
 * @param {string|string[]} searchPaths - Directory(ies) to search
 * @param {Object} options - Search options
 * @param {boolean} [options.caseSensitive=false] - Use case-sensitive matching
 * @param {number} [options.maxDepth=Infinity] - Maximum search depth
 * @param {boolean} [options.quiet=false] - Minimal output
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<Object>} Search results
 *
 * @example
 * const results = await findPhotosForExport('./data.json', '/photos', {
 *   caseSensitive: false,
 *   maxDepth: 5
 * })
 */
export async function findPhotosForExport (exportPath, searchPaths, options = {}) {
  const {
    caseSensitive = false,
    maxDepth = Infinity,
    quiet = false,
    onProgress = null
  } = options

  const startTime = Date.now()

  // Load export file
  if (!quiet) displayInfo('Loading export file...')
  const exportData = await loadExportFile(exportPath)

  // Calculate marker numbers by creation date (earliest = #1)
  const sortedMarkers = [...exportData.markers].sort((a, b) => {
    return new Date(a.createdDate) - new Date(b.createdDate)
  })
  const markerNumbers = new Map()
  sortedMarkers.forEach((marker, index) => {
    markerNumbers.set(marker.id, index + 1) // 1-based numbering
  })

  // Extract photo filenames from photos array
  const photoFilenames = exportData.photos.map(p => p.fileName)
  const uniqueFilenames = [...new Set(photoFilenames)]

  if (!quiet) {
    displayInfo(`Export loaded: ${exportData.map.name}`)
    displayInfo(`Total photos to find: ${uniqueFilenames.length}`)
  }

  // Normalize search paths
  const searchPathArray = Array.isArray(searchPaths)
    ? searchPaths
    : [searchPaths]

  // Search for photos in each directory
  const foundFiles = new Map() // filename -> [paths]

  for (const searchPath of searchPathArray) {
    if (!quiet) displayInfo(`Searching in: ${searchPath}`)

    const results = await findFilesByName(searchPath, uniqueFilenames, {
      maxDepth,
      onProgress
    })

    // Group results by filename (case-insensitive)
    for (const filePath of results) {
      const filename = path.basename(filePath)
      const normalizedName = caseSensitive ? filename : filename.toLowerCase()
      const targetName = caseSensitive
        ? filename
        : uniqueFilenames.find(f => f.toLowerCase() === normalizedName)

      if (targetName) {
        if (!foundFiles.has(targetName)) {
          foundFiles.set(targetName, [])
        }
        foundFiles.get(targetName).push(filePath)
      }
    }
  }

  // Build photo -> marker mapping for marker numbers
  const photoToMarker = new Map()
  for (const photo of exportData.photos) {
    const marker = exportData.markers.find(m => m.id === photo.markerId)
    if (marker) {
      photoToMarker.set(photo.fileName, {
        markerNumber: markerNumbers.get(marker.id) || '?',
        markerDescription: marker.description
      })
    }
  }

  // Categorize results with marker info
  const found = []
  const missing = []
  const duplicates = []

  for (const filename of uniqueFilenames) {
    const paths = foundFiles.get(filename) || []
    const markerInfo = photoToMarker.get(filename) || { markerNumber: '?', markerDescription: '' }

    if (paths.length === 0) {
      missing.push({
        filename,
        markerNumber: markerInfo.markerNumber,
        markerDescription: markerInfo.markerDescription
      })
    } else if (paths.length === 1) {
      found.push({
        filename,
        path: paths[0],
        markerNumber: markerInfo.markerNumber,
        markerDescription: markerInfo.markerDescription
      })
    } else {
      duplicates.push({
        filename,
        paths,
        markerNumber: markerInfo.markerNumber,
        markerDescription: markerInfo.markerDescription
      })
      found.push({
        filename,
        path: paths[0],
        isDuplicate: true,
        markerNumber: markerInfo.markerNumber,
        markerDescription: markerInfo.markerDescription
      })
    }
  }

  const duration = Date.now() - startTime

  return {
    exportFile: path.basename(exportPath),
    exportPath,
    mapName: exportData.map.name,
    searchPaths: searchPathArray,
    totalPhotos: uniqueFilenames.length,
    found,
    missing,
    duplicates,
    duration: formatDuration(duration),
    durationMs: duration,
    exportData
  }
}

/**
 * Generate detailed log file with per-marker photo paths
 *
 * @param {Object} results - Search results from findPhotosForExport
 * @param {string} logPath - Output log file path
 * @returns {Promise<void>}
 *
 * @example
 * await generateLogFile(results, './photo-log.txt')
 */
export async function generateLogFile (results, logPath) {
  const lines = []
  const { exportData, found, missing, duplicates } = results

  // Header
  lines.push('SnapSpot Photo Finder Log')
  lines.push(`Generated: ${new Date().toLocaleString()}`)
  lines.push(`Export: ${results.exportFile}`)
  lines.push(`Search Paths: ${results.searchPaths.join(', ')}`)
  lines.push('')

  // Summary
  lines.push('===== SUMMARY =====')
  lines.push(`Map: ${results.mapName}`)
  lines.push(`Total Markers: ${exportData.markers.length}`)
  lines.push(`Total Photos: ${results.totalPhotos}`)
  lines.push(`Found: ${found.length}`)
  lines.push(`Missing: ${missing.length}`)
  lines.push(`Duplicates: ${duplicates.length}`)
  lines.push(`Search Duration: ${results.duration}`)
  lines.push('')

  // Details - grouped by marker
  lines.push('===== DETAILS =====')
  lines.push('')
  lines.push(`Map: ${exportData.map.name}`)

  // Create photo status lookup
  const photoStatusMap = new Map()
  for (const item of found) {
    photoStatusMap.set(item.filename, {
      status: 'found',
      path: item.path,
      isDuplicate: item.isDuplicate
    })
  }
  for (const item of missing) {
    photoStatusMap.set(item.filename, { status: 'missing' })
  }

  // Create duplicate lookup
  const duplicateMap = new Map()
  for (const item of duplicates) {
    duplicateMap.set(item.filename, item.paths)
  }

  // Process each marker
  for (const marker of exportData.markers) {
    const markerNumber = marker.number || '?'
    const markerDesc = marker.description || 'No description'

    lines.push(`  Marker #${markerNumber}: ${markerDesc}`)

    // Find photos for this marker
    const markerPhotos = exportData.photos.filter(p => p.markerId === marker.id)

    if (markerPhotos.length === 0) {
      lines.push('    (No photos)')
      lines.push('')
      continue
    }

    // List photos for this marker
    for (const photo of markerPhotos) {
      const filename = photo.fileName
      const status = photoStatusMap.get(filename)

      if (!status) {
        lines.push(`    ? ${filename} (UNKNOWN STATUS)`)
      } else if (status.status === 'found') {
        if (status.isDuplicate) {
          const allPaths = duplicateMap.get(filename) || []
          lines.push(`    ⚠ ${filename} (DUPLICATE):`)
          for (const p of allPaths) {
            lines.push(`      - ${p}`)
          }
        } else {
          lines.push(`    ✓ ${filename} -> ${status.path}`)
        }
      } else {
        lines.push(`    ✗ ${filename} (NOT FOUND)`)
      }
    }

    lines.push('')
  }

  // Footer
  lines.push('===== END OF LOG =====')

  // Write to file
  await fs.writeFile(logPath, lines.join('\n'), 'utf-8')
}

/**
 * Generate internal manifest for Organizer tool
 *
 * INTERNAL USE ONLY - for programmatic invocation by Organizer.
 * Returns in-memory data structure, not saved to disk.
 *
 * @param {Object} results - Search results from findPhotosForExport
 * @returns {Object} Internal manifest
 */
export function generateInternalManifest (results) {
  const { exportData } = results
  const photoMap = new Map()

  // Create photo status map
  for (const item of results.found) {
    photoMap.set(item.filename, {
      filename: item.filename,
      status: 'found',
      foundPath: item.path,
      isDuplicate: item.isDuplicate || false
    })
  }
  for (const item of results.missing) {
    photoMap.set(item.filename, {
      filename: item.filename,
      status: 'missing',
      foundPath: null,
      isDuplicate: false
    })
  }

  // Build photo list with marker context
  const photos = []
  for (const photo of exportData.photos) {
    const status = photoMap.get(photo.fileName)
    const marker = exportData.markers.find(m => m.id === photo.markerId)

    if (status && marker) {
      photos.push({
        ...status,
        markerId: marker.id,
        markerNumber: marker.number,
        markerDescription: marker.description,
        mapName: exportData.map.name
      })
    }
  }

  return {
    export: {
      path: results.exportPath,
      name: results.exportFile
    },
    search: {
      directories: results.searchPaths,
      duration: results.duration
    },
    results: {
      totalPhotos: results.totalPhotos,
      found: results.found.length,
      missing: results.missing.length,
      duplicates: results.duplicates.length
    },
    photos
  }
}

/**
 * Run Photo Finder in interactive mode
 */
async function runInteractive () {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  displayHeader('SnapSpot Photo Finder - Interactive Mode')

  // Step 1: Prompt for export file
  const exportPath = await new Promise((resolve) => {
    rl.question('Select SnapSpot export file: ', (answer) => {
      resolve(path.resolve(answer.trim()))
    })
  })

  // Load and display summary
  const exportData = await loadExportFile(exportPath)

  displayHeader('Export Summary')
  console.log(`Map: ${exportData.map.name}`)
  console.log(`Markers: ${exportData.markers.length}`)
  console.log(`Photos: ${exportData.photos.length}`)
  console.log(`Created: ${exportData.map.created ? new Date(exportData.map.created).toLocaleDateString() : 'Unknown'}`)
  console.log('')

  // Step 2: Prompt for search directories
  displayInfo('Enter directories to search (comma-separated):')
  const searchDirs = await new Promise((resolve) => {
    rl.question('Search directories: ', (answer) => {
      resolve(answer.trim())
    })
  })

  const searchPaths = searchDirs.split(',').map(s => s.trim())

  // Step 3: Search for photos
  displayHeader('Searching for Photos')

  const bar = createProgressBar(100, {
    format: 'Searching {bar} {percentage}% | Files scanned: {value}'
  })
  bar.start()

  let filesScanned = 0
  const results = await findPhotosForExport(exportPath, searchPaths, {
    quiet: true,
    onProgress: (current, total) => {
      filesScanned = current
      bar.update(Math.min(100, filesScanned / 10)) // Estimate progress
    }
  })

  bar.stop()

  // Step 4: Display results
  displayHeader('Search Results')
  console.log(`Total Photos: ${results.totalPhotos}`)
  displaySuccess(`Found: ${results.found.length}`)
  if (results.missing.length > 0) {
    displayWarning(`Missing: ${results.missing.length}`)
  }
  if (results.duplicates.length > 0) {
    displayWarning(`Duplicates: ${results.duplicates.length}`)
  }
  console.log(`Search Duration: ${results.duration}`)
  console.log('')

  // Step 5: Offer to save report
  const saveReportAnswer = await new Promise((resolve) => {
    rl.question('Save summary report? (Y/n) ', (answer) => {
      resolve(answer.trim().toLowerCase())
    })
  })

  const saveReport = saveReportAnswer === '' || saveReportAnswer.startsWith('y')

  if (saveReport) {
    console.log('Available formats:')
    console.log('1. HTML (recommended)')
    console.log('2. JSON')
    console.log('3. Text')
    const formatInput = await new Promise((resolve) => {
      rl.question('Enter format number (1-3): ', (answer) => {
        resolve(answer.trim())
      })
    })

    const formatMap = { 1: 'html', 2: 'json', 3: 'text' }
    const format = formatMap[formatInput] || 'html'

    const exportDir = path.dirname(results.exportPath)
    const sanitizedMapName = results.mapName.replace(/[^a-z0-9_-]/gi, '_')
    const defaultName = path.join(exportDir, `${sanitizedMapName}_photo_finder_report.${format}`)

    const reportPath = await new Promise((resolve) => {
      rl.question(`Report file path (${defaultName}): `, (answer) => {
        resolve(answer.trim() || defaultName)
      })
    })

    // Combine missing and duplicates for details section
    const detailRows = []
    for (const photo of results.missing) {
      detailRows.push([`#${photo.markerNumber}`, photo.filename, 'Missing'])
    }
    for (const photo of results.duplicates) {
      detailRows.push([`#${photo.markerNumber}`, photo.filename, `Duplicate (${photo.paths.length} copies)`])
    }

    const reportData = {
      title: `${results.mapName} - Photo Finder Report`,
      subtitle: `Missing: ${results.missing.length}, Duplicates: ${results.duplicates.length}`,
      summary: {
        totalPhotos: results.totalPhotos,
        found: results.found.length,
        missing: results.missing.length,
        duplicates: results.duplicates.length,
        searchPaths: results.searchPaths.join(', '),
        duration: results.duration
      },
      detailHeaders: ['Marker #', 'Filename', 'Status'],
      details: detailRows,
      footer: 'Generated by SnapSpot Photo Finder'
    }

    let reportContent
    if (format === 'json') {
      reportContent = generateJsonReport(reportData)
    } else if (format === 'html') {
      reportContent = generateHtmlReport(reportData)
    } else {
      reportContent = generateTextReport(reportData)
    }

    await writeReportToFile(reportContent, reportPath)
    displaySuccess(`Report saved to: ${reportPath}`)
  }

  // Step 6: Offer to save log file
  const saveLogAnswer = await new Promise((resolve) => {
    rl.question('Save detailed log file? (Y/n) ', (answer) => {
      resolve(answer.trim().toLowerCase())
    })
  })

  const saveLog = saveLogAnswer === '' || saveLogAnswer.startsWith('y')

  if (saveLog) {
    const defaultLogName = `${results.mapName.replace(/[^a-z0-9_-]/gi, '_')}_photo_log.txt`
    const logPath = await new Promise((resolve) => {
      rl.question(`Log file path (${defaultLogName}): `, (answer) => {
        resolve(answer.trim() || defaultLogName)
      })
    })

    await generateLogFile(results, logPath)
    displaySuccess(`Log file saved to: ${logPath}`)
  }

  rl.close()

  // Step 7: Suggest Organizer tool if appropriate
  if (results.found.length > 0) {
    console.log('')
    displayInfo('Photos found! To organize them into an archive, use the Organizer tool.')
    displayInfo('Run: organizer --help')
  } else if (results.missing.length > 0) {
    console.log('')
    displayWarning(`${results.missing.length} photos not found. Recover missing photos before using Organizer.`)
  }

  console.log('')
  displaySuccess('Photo Finder complete!')
}

/**
 * Run Photo Finder in CLI mode
 */
async function runCli (args) {
  const exportPath = args.export
  const searchPaths = args.search.split(',').map(s => s.trim())
  const reportPath = args.report
  const logPath = args.log
  const format = args.format || 'text'
  const quiet = args.quiet || false
  const caseSensitive = args.caseSensitive || false
  const maxDepth = args.maxDepth || Infinity

  if (!quiet) displayHeader('SnapSpot Photo Finder')

  // Search for photos
  const results = await findPhotosForExport(exportPath, searchPaths, {
    caseSensitive,
    maxDepth,
    quiet,
    onProgress: quiet
      ? null
      : (current, total) => {
          if (current % 1000 === 0) {
            displayInfo(`Files scanned: ${current}`)
          }
        }
  })

  // Display results
  if (!quiet) {
    displayHeader('Results')
    console.log(`Total Photos: ${results.totalPhotos}`)
    displaySuccess(`Found: ${results.found.length}`)
    if (results.missing.length > 0) {
      displayWarning(`Missing: ${results.missing.length}`)
    }
    if (results.duplicates.length > 0) {
      displayWarning(`Duplicates: ${results.duplicates.length}`)
    }
    console.log(`Duration: ${results.duration}`)
    console.log('')
  }

  // Save report if requested
  if (reportPath) {
    // If reportPath is just a filename, save in export directory
    const finalReportPath = path.isAbsolute(reportPath) || reportPath.includes(path.sep)
      ? reportPath
      : path.join(path.dirname(results.exportPath), reportPath)

    // Combine missing and duplicates for details section
    const detailRows = []
    for (const photo of results.missing) {
      detailRows.push([`#${photo.markerNumber}`, photo.filename, 'Missing'])
    }
    for (const photo of results.duplicates) {
      detailRows.push([`#${photo.markerNumber}`, photo.filename, `Duplicate (${photo.paths.length} copies)`])
    }

    const reportData = {
      title: `${results.mapName} - Photo Finder Report`,
      subtitle: `Missing: ${results.missing.length}, Duplicates: ${results.duplicates.length}`,
      summary: {
        totalPhotos: results.totalPhotos,
        found: results.found.length,
        missing: results.missing.length,
        duplicates: results.duplicates.length,
        searchPaths: results.searchPaths.join(', '),
        duration: results.duration
      },
      detailHeaders: ['Marker #', 'Filename', 'Status'],
      details: detailRows,
      footer: 'Generated by SnapSpot Photo Finder'
    }

    let reportContent
    if (format === 'json') {
      reportContent = generateJsonReport(reportData)
    } else if (format === 'html') {
      reportContent = generateHtmlReport(reportData)
    } else {
      reportContent = generateTextReport(reportData)
    }

    await writeReportToFile(reportContent, finalReportPath)
    if (!quiet) displaySuccess(`Report saved to: ${finalReportPath}`)
  }

  // Save log file if requested
  if (logPath) {
    // If logPath is just a filename, save in export directory
    const finalLogPath = path.isAbsolute(logPath) || logPath.includes(path.sep)
      ? logPath
      : path.join(path.dirname(results.exportPath), logPath)

    await generateLogFile(results, finalLogPath)
    if (!quiet) displaySuccess(`Log file saved to: ${finalLogPath}`)
  }

  // Exit with appropriate code
  if (results.missing.length > 0) {
    if (!quiet) displayWarning('Some photos not found (exit code 1)')
    process.exit(1)
  } else {
    if (!quiet) displaySuccess('All photos found!')
    process.exit(0)
  }
}

/**
 * Display help message
 */
function displayHelp () {
  console.log(`
SnapSpot Photo Finder - Find original photos referenced in exports

USAGE:
  Interactive mode:
    photo-finder

  CLI mode:
    photo-finder --export <path> --search <paths> [options]

OPTIONS:
  --export <path>         Path to SnapSpot export JSON file
  --search <paths>        Comma-separated search directory paths
  --report <path>         Save summary report to file
  --format <type>         Report format: json, text, html (default: text)
  --log <path>            Save detailed log file with full paths
  --case-sensitive        Use case-sensitive filename matching
  --max-depth <n>         Maximum search depth (default: unlimited)
  --quiet                 Minimal output
  --help                  Show this help message

EXAMPLES:
  # Interactive mode (recommended for first-time users)
  photo-finder

  # Find photos and save HTML report
  photo-finder --export data.json --search /photos --report report.html --format html

  # Search multiple directories
  photo-finder --export data.json --search "/photos,/backup/photos"

  # Save detailed log file
  photo-finder --export data.json --search /photos --log photo-paths.txt

  # Case-sensitive search with depth limit
  photo-finder --export data.json --search /photos --case-sensitive --max-depth 3

NOTES:
  - Photo Finder is READ-ONLY and does not copy or modify files
  - Use case-insensitive matching by default (IMG_1234.jpg matches img_1234.JPG)
  - Duplicates are reported but do not prevent success
  - Exit code 0 = all photos found, 1 = some photos missing

For more information, see: cli/tools/photo-finder/README.md
`)
}

/**
 * Parse command-line arguments
 */
function parseArgs () {
  const args = process.argv.slice(2)
  const parsed = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--help' || arg === '-h') {
      parsed.help = true
    } else if (arg === '--export') {
      parsed.export = args[++i]
    } else if (arg === '--search') {
      parsed.search = args[++i]
    } else if (arg === '--report') {
      parsed.report = args[++i]
    } else if (arg === '--format') {
      parsed.format = args[++i]
    } else if (arg === '--log') {
      parsed.log = args[++i]
    } else if (arg === '--case-sensitive') {
      parsed.caseSensitive = true
    } else if (arg === '--max-depth') {
      parsed.maxDepth = parseInt(args[++i], 10)
    } else if (arg === '--quiet') {
      parsed.quiet = true
    }
  }

  return parsed
}

/**
 * Main entry point
 */
async function main () {
  const args = parseArgs()

  if (args.help) {
    displayHelp()
    return
  }

  // Determine mode
  if (args.export && args.search) {
    // CLI mode
    await runCli(args)
  } else if (Object.keys(args).length === 0) {
    // Interactive mode
    await runInteractive()
  } else {
    displayError('Invalid arguments. Use --help for usage information.')
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('photo-finder.js')) {
  main().catch(err => {
    displayError(`Fatal error: ${err.message}`)
    console.error(err.stack)
    process.exit(1)
  })
}

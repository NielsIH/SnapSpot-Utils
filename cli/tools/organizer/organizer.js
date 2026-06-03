#!/usr/bin/env node

/**
 * Organizer - Build organized archives from SnapSpot export + original photos.
 *
 * @module cli/tools/organizer
 */

import fs from 'fs/promises'
import path from 'path'
import fsExtra from 'fs-extra'
import inquirer from 'inquirer'
import { loadExportFile } from '../../shared/export-loader.js'
import {
  promptForFile,
  promptForDirectory,
  promptForChoice,
  promptForConfirmation,
  displaySuccess,
  displayError,
  displayInfo,
  displayWarning,
  displayHeader
} from '../../shared/prompt-helpers.js'
import { createProgressBar } from '../../shared/progress-bar.js'
import {
  generateTextReport,
  generateJsonReport,
  generateHtmlReport,
  writeReportToFile
} from '../../shared/report-generator.js'
import {
  findPhotosForExport,
  generateInternalManifest
} from '../photo-finder/photo-finder.js'
import {
  buildOrganizationPlan,
  SUPPORTED_SCHEMES,
  SCHEME_CHOICES
} from './schemes.js'
import { formatPlanPreview, buildIndexHtml } from './preview.js'

async function invokePhotoFinder (exportPath, searchPaths) {
  try {
    const results = await findPhotosForExport(exportPath, searchPaths, {
      quiet: true
    })

    const manifest = generateInternalManifest(results)

    return {
      manifest,
      summary: {
        total: results.totalPhotos,
        found: results.found.length,
        missing: results.missing.length,
        duplicates: results.duplicates.length,
        duration: results.duration
      }
    }
  } catch (error) {
    throw new Error(`Photo search failed: ${error.message}`)
  }
}

function parseSearchPaths (input) {
  if (Array.isArray(input)) {
    return input.map((entry) => String(entry).trim()).filter(Boolean)
  }

  return String(input || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

async function loadManifestFile (manifestPath, exportPath) {
  let parsed

  try {
    const content = await fs.readFile(manifestPath, 'utf-8')
    parsed = JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to read manifest file: ${error.message}`)
  }

  if (!parsed || !Array.isArray(parsed.photos) || !parsed.results) {
    throw new Error('Invalid manifest format. Use Photo Finder --manifest output.')
  }

  // Always align export source path to current Organizer input for copy-export.
  parsed.export = {
    ...(parsed.export || {}),
    path: exportPath,
    name: path.basename(exportPath)
  }

  return {
    manifest: parsed,
    summary: {
      total: parsed.results.totalPhotos || 0,
      found: parsed.results.found || 0,
      missing: parsed.results.missing || 0,
      duplicates: parsed.results.duplicates || 0,
      duration: parsed.search?.duration || 'n/a'
    }
  }
}

function buildReadmeContent ({ scheme, exportData, summary, copyExport, createIndex }) {
  const lines = []
  lines.push('SnapSpot Archive')
  lines.push(`Created: ${new Date().toLocaleString()}`)
  lines.push(`Organization Scheme: ${scheme}`)
  lines.push('')
  lines.push('This archive contains:')

  if (copyExport) {
    lines.push('- SnapSpot export file')
  }

  lines.push('- Original high-quality photos found by Photo Finder')

  if (createIndex) {
    lines.push('- index.html for archive browsing')
  }

  lines.push('')
  lines.push('Search Summary:')
  lines.push(`- Total referenced photos: ${summary.total}`)
  lines.push(`- Found: ${summary.found}`)
  lines.push(`- Missing: ${summary.missing}`)
  lines.push(`- Duplicates: ${summary.duplicates}`)
  lines.push(`- Search duration: ${summary.duration}`)
  lines.push('')
  lines.push('Export Summary:')
  lines.push(`- Map: ${exportData.map?.name || 'Unknown'}`)
  lines.push(`- Markers: ${exportData.markers.length}`)
  lines.push(`- Photos: ${exportData.photos.length}`)
  lines.push('')
  lines.push('Need detailed missing-photo diagnostics?')
  lines.push('Run Photo Finder with report and log output:')
  lines.push('photo-finder --export <path> --search <paths> --report --log')

  return lines.join('\n')
}

function splitFileName (filePath) {
  const ext = path.extname(filePath)
  const name = path.basename(filePath, ext)
  const dir = path.dirname(filePath)
  return { ext, name, dir }
}

async function getUniqueDestination (requestedPath, reserved) {
  if (!reserved.has(requestedPath) && !(await fsExtra.pathExists(requestedPath))) {
    reserved.add(requestedPath)
    return requestedPath
  }

  const { name, ext, dir } = splitFileName(requestedPath)

  let index = 1
  while (true) {
    const candidate = path.join(dir, `${name}-${index}${ext}`)
    if (!reserved.has(candidate) && !(await fsExtra.pathExists(candidate))) {
      reserved.add(candidate)
      return candidate
    }
    index++
  }
}

async function applyPlan (plan, options = {}) {
  const { dryRun = false } = options

  const copiedFiles = []

  if (dryRun) {
    return {
      copiedFiles,
      missingCount: plan.skippedMissing.length
    }
  }

  const dirs = [...plan.directories].sort((a, b) => a.localeCompare(b))
  for (const dirPath of dirs) {
    await fsExtra.ensureDir(dirPath)
  }

  const bar = createProgressBar(plan.files.length || 1, {
    format: 'Copying {bar} {percentage}% | {value}/{total}'
  })

  bar.start()

  let current = 0
  const reservedDestinations = new Set()

  for (const file of plan.files) {
    const finalDestination = await getUniqueDestination(file.destination, reservedDestinations)

    await fsExtra.ensureDir(path.dirname(finalDestination))
    await fsExtra.copy(file.source, finalDestination)

    copiedFiles.push({
      kind: file.kind,
      absolutePath: finalDestination,
      relativePath: path.relative(plan.outputDir, finalDestination)
    })

    current++
    bar.update(current, {
      file: path.basename(finalDestination)
    })
  }

  bar.complete()

  return {
    copiedFiles,
    missingCount: plan.skippedMissing.length
  }
}

function buildReportData ({ options, summary, exportData, execution }) {
  return {
    title: 'SnapSpot Organizer Report',
    subtitle: `${exportData.map?.name || 'Unknown map'} | Scheme: ${options.scheme}`,
    summary: {
      scheme: options.scheme,
      outputDir: options.output,
      copyExport: options.copyExport,
      createIndex: options.createIndex,
      dryRun: options.dryRun,
      exportMap: exportData.map?.name || 'Unknown',
      totalMarkers: exportData.markers.length,
      totalPhotosInExport: exportData.photos.length,
      totalPhotosReferenced: summary.total,
      photosFound: summary.found,
      photosMissing: summary.missing,
      duplicates: summary.duplicates,
      copiedFiles: execution.copiedFiles.length
    },
    detailHeaders: ['Type', 'Path'],
    details: execution.copiedFiles.map((entry) => [entry.kind, entry.relativePath]),
    footer: 'Generated by SnapSpot Organizer'
  }
}

function getReportFormatFromPath (reportPath) {
  const ext = path.extname(reportPath).toLowerCase()
  if (ext === '.json') return 'json'
  if (ext === '.html' || ext === '.htm') return 'html'
  return 'text'
}

async function writeOptionalOutputs ({ options, exportData, summary, execution }) {
  if (options.dryRun) {
    return
  }

  const readmePath = path.join(options.output, 'README.txt')
  const readmeContent = buildReadmeContent({
    scheme: options.scheme,
    exportData,
    summary,
    copyExport: options.copyExport,
    createIndex: options.createIndex
  })

  await fs.writeFile(readmePath, readmeContent, 'utf-8')

  if (options.createIndex) {
    const html = buildIndexHtml({
      scheme: options.scheme,
      copiedFiles: execution.copiedFiles,
      missingCount: execution.missingCount
    })

    const indexPath = path.join(options.output, 'index.html')
    await fs.writeFile(indexPath, html, 'utf-8')
  }

  if (options.report) {
    const reportData = buildReportData({
      options,
      summary,
      exportData,
      execution
    })

    const format = getReportFormatFromPath(options.report)
    let content

    if (format === 'json') {
      content = generateJsonReport(reportData)
    } else if (format === 'html') {
      content = generateHtmlReport(reportData)
    } else {
      content = generateTextReport(reportData)
    }

    await writeReportToFile(content, options.report)
  }
}

function showSummary (summary) {
  displayHeader('Photo Search Summary')
  console.log(`Total referenced: ${summary.total}`)
  displaySuccess(`Found: ${summary.found}`)

  if (summary.missing > 0) {
    displayWarning(`Missing: ${summary.missing}`)
  }

  if (summary.duplicates > 0) {
    displayWarning(`Duplicates: ${summary.duplicates}`)
  }

  console.log(`Duration: ${summary.duration}`)
  console.log('')
}

async function runOrganizer (options) {
  const exportData = await loadExportFile(options.export)

  const { manifest, summary } = options.manifestPath
    ? await loadManifestFile(options.manifestPath, options.export)
    : await invokePhotoFinder(options.export, options.searchPaths)
  showSummary(summary)

  if (summary.missing > 0 && !options.missingOk) {
    displayError('Missing photos detected. Use --missing-ok to continue anyway.')
    displayInfo('For detailed diagnostics: photo-finder --export <path> --search <paths> --report --log')
    process.exit(1)
  }

  const plan = buildOrganizationPlan({
    manifest,
    exportData,
    outputDir: options.output,
    scheme: options.scheme,
    copyExport: options.copyExport
  })

  const preview = formatPlanPreview(plan)
  displayHeader('Archive Preview')
  console.log(preview)
  console.log('')

  if (options.interactive) {
    const confirmed = await promptForConfirmation('Create archive with this plan?', true)
    if (!confirmed) {
      displayWarning('Operation cancelled by user.')
      return
    }
  }

  const execution = await applyPlan(plan, {
    dryRun: options.dryRun
  })

  await writeOptionalOutputs({
    options,
    exportData,
    summary,
    execution
  })

  if (options.dryRun) {
    displayInfo('Dry run complete. No files were created.')
  } else {
    displaySuccess(`Archive created: ${options.output}`)
    displayInfo(`Files copied: ${execution.copiedFiles.length}`)

    if (options.report) {
      displayInfo(`Report saved: ${options.report}`)
    }

    if (summary.missing > 0) {
      displayWarning(`Proceeding with missing photos: ${summary.missing}`)
    }
  }
}

async function collectSearchPathsInteractive () {
  const paths = []

  while (true) {
    const dirPath = await promptForDirectory('Photo search directory:', {
      mustExist: true,
      createIfNotExists: false
    })

    paths.push(dirPath)

    const addAnother = await promptForConfirmation('Add another search directory?', false)
    if (!addAnother) {
      break
    }
  }

  return paths
}

async function runInteractive () {
  displayHeader('SnapSpot Organizer - Interactive Mode')

  const exportPath = await promptForFile('SnapSpot export file (.json):', {
    allowedExtensions: ['.json'],
    mustExist: true
  })

  const inputMode = await promptForChoice('Photo source input:', [
    {
      name: 'Search directories now (run Photo Finder internally)',
      value: 'search'
    },
    {
      name: 'Use existing Photo Finder manifest JSON',
      value: 'manifest'
    }
  ], {
    default: 'search'
  })

  let searchPaths = []
  let manifestPath = null

  if (inputMode === 'search') {
    searchPaths = await collectSearchPathsInteractive()
  } else {
    manifestPath = await promptForFile('Photo Finder manifest JSON file:', {
      allowedExtensions: ['.json'],
      mustExist: true
    })
  }

  const scheme = await promptForChoice('Organization scheme:', SCHEME_CHOICES, {
    default: 'by-map'
  })

  const outputDir = await promptForDirectory('Output directory:', {
    mustExist: false,
    createIfNotExists: true
  })

  const copyExport = await promptForConfirmation('Include export file in archive?', true)
  const createIndex = await promptForConfirmation('Generate index.html?', false)
  const missingOk = await promptForConfirmation('Continue when photos are missing?', false)
  const dryRun = await promptForConfirmation('Dry run (preview only, no file writes)?', false)

  let report = null
  const wantReport = await promptForConfirmation('Save organizer report?', false)

  if (wantReport) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'reportPath',
        message: 'Report path (.txt, .json, .html):',
        default: path.join(outputDir, 'organizer-report.txt'),
        validate: (input) => {
          if (!input.trim()) return 'Report path is required'
          return true
        }
      }
    ])

    report = path.resolve(answer.reportPath)
  }

  await runOrganizer({
    export: exportPath,
    searchPaths,
    manifestPath,
    output: outputDir,
    scheme,
    createIndex,
    copyExport,
    missingOk,
    dryRun,
    report,
    interactive: true
  })
}

function parseArgs () {
  const args = process.argv.slice(2)
  const parsed = {
    copyExport: false,
    createIndex: false,
    missingOk: false,
    dryRun: false,
    interactive: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--help' || arg === '-h') {
      parsed.help = true
    } else if (arg === '--export') {
      parsed.export = args[++i]
    } else if (arg === '--search') {
      parsed.search = args[++i]
    } else if (arg === '--manifest') {
      parsed.manifest = args[++i]
    } else if (arg === '--output') {
      parsed.output = args[++i]
    } else if (arg === '--scheme') {
      parsed.scheme = args[++i]
    } else if (arg === '--create-index') {
      parsed.createIndex = true
    } else if (arg === '--copy-export') {
      parsed.copyExport = true
    } else if (arg === '--missing-ok') {
      parsed.missingOk = true
    } else if (arg === '--dry-run') {
      parsed.dryRun = true
    } else if (arg === '--report') {
      parsed.report = args[++i]
    } else if (arg === '--interactive') {
      parsed.interactive = true
    }
  }

  return parsed
}

function validateCliArgs (args) {
  if (!args.export || !args.output) {
    return 'CLI mode requires --export and --output'
  }

  if (!args.search && !args.manifest) {
    return 'Provide either --search <paths> or --manifest <path>'
  }

  if (args.search && args.manifest) {
    return 'Use either --search or --manifest, not both'
  }

  if (!args.scheme) {
    args.scheme = 'by-map'
  }

  if (!SUPPORTED_SCHEMES.includes(args.scheme)) {
    return `Invalid --scheme value. Expected one of: ${SUPPORTED_SCHEMES.join(', ')}`
  }

  if (args.report === undefined) {
    return null
  }

  if (!args.report) {
    return '--report requires a file path'
  }

  return null
}

function displayHelp () {
  console.log(`
SnapSpot Organizer - Create organized archives with export + original photos

USAGE:
  Interactive mode:
    organizer

  CLI mode:
    organizer --export <path> --search <paths> --output <path> [options]
    organizer --export <path> --manifest <path> --output <path> [options]

OPTIONS:
  --export <path>         Path to SnapSpot export JSON file
  --search <paths>        Comma-separated search directory paths
  --manifest <path>       Photo Finder manifest JSON file (alternative to --search)
  --output <path>         Output archive directory
  --scheme <name>         by-map | by-marker | by-date | categorized | flat
  --copy-export           Include export file in archive
  --create-index          Generate index.html in output directory
  --missing-ok            Continue even when photos are missing
  --dry-run               Preview structure without writing files
  --report <path>         Save organizer report (.txt, .json, .html)
  --interactive           Force interactive mode
  --help                  Show this help message

NOTES:
  - Organizer calls Photo Finder internally (no duplicated search logic)
  - Or reuse a previous Photo Finder manifest via --manifest
  - Organizer shows compact search summary only
  - For detailed diagnostics use: photo-finder --report --log
`)
}

async function main () {
  const rawArgs = process.argv.slice(2)
  const args = parseArgs()

  if (args.help) {
    displayHelp()
    return
  }

  const hasAnyArg = rawArgs.length > 0

  const shouldRunInteractive = args.interactive || !hasAnyArg

  if (shouldRunInteractive) {
    await runInteractive()
    return
  }

  const validationError = validateCliArgs(args)
  if (validationError) {
    displayError(validationError)
    process.exit(1)
  }

  await runOrganizer({
    export: path.resolve(args.export),
    searchPaths: args.search ? parseSearchPaths(args.search) : [],
    manifestPath: args.manifest ? path.resolve(args.manifest) : null,
    output: path.resolve(args.output),
    scheme: args.scheme,
    createIndex: args.createIndex,
    copyExport: args.copyExport,
    missingOk: args.missingOk,
    dryRun: args.dryRun,
    report: args.report ? path.resolve(args.report) : null,
    interactive: false
  })
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('organizer.js')) {
  main().catch((err) => {
    displayError(`Fatal error: ${err.message}`)
    console.error(err.stack)
    process.exit(1)
  })
}

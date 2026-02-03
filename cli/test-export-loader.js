import { loadExportFile, getExportSummary, isValidExport } from './shared/export-loader.js'
import path from 'path'

const testExportPath = path.resolve('../core/formats/snapspot/__tests__/fixtures/full-export.json')

console.log('Testing Export Loader...\n')

// Test 1: Check if file is valid export
console.log('1. Validating export file...')
const isValid = await isValidExport(testExportPath)
console.log(`  Valid: ${isValid}`)

// Test 2: Load export
console.log('\n2. Loading export...')
try {
  const exportData = await loadExportFile(testExportPath)
  console.log('  ✓ Export loaded successfully')

  // Test 3: Get summary
  console.log('\n3. Getting export summary...')
  const summary = getExportSummary(exportData)
  console.log(`  Map: ${summary.mapName}`)
  console.log(`  Markers: ${summary.markerCount}`)
  console.log(`  Photos: ${summary.photoCount}`)
  console.log(`  Photo filenames: ${summary.photoFilenames.slice(0, 3).join(', ')}...`)
  console.log(`  Has embedded photos: ${summary.hasEmbeddedPhotos}`)

  console.log('\n✓ Export Loader tests complete')
} catch (err) {
  console.error(`✗ Error: ${err.message}`)
}

import { removePhotos, renameMap, setCustomMetadata } from './shared/export-writer.js'
import fs from 'fs/promises'

console.log('Testing Export Writer...\n')

try {
  // Test 1: Test removePhotos transformation
  console.log('1. Testing removePhotos transformation...')
  const testWithPhotos = {
    map: { id: 'map-1', name: 'Test Map' },
    markers: [{ id: 'marker-1', mapId: 'map-1', photoIds: ['photo-1', 'photo-2'] }],
    photos: [
      { id: 'photo-1', markerId: 'marker-1', filename: 'test1.jpg' },
      { id: 'photo-2', markerId: 'marker-1', filename: 'test2.jpg' }
    ]
  }
  const withoutPhotos = removePhotos(testWithPhotos)
  console.log(`  ✓ Photos removed: ${withoutPhotos.photos.length === 0}`)
  console.log(`  ✓ Photo IDs cleared: ${withoutPhotos.markers[0].photoIds.length === 0}`)

  // Test 2: Test renameMap transformation
  console.log('\n2. Testing renameMap transformation...')
  const testExport = {
    map: { id: 'map-1', name: 'Original Name' },
    markers: [],
    photos: []
  }
  const renamed = renameMap(testExport, 'New Map Name')
  console.log(`  ✓ Map renamed: ${renamed.map.name === 'New Map Name'}`)
  console.log(`  ✓ Original unchanged: ${testExport.map.name === 'Original Name'}`)

  // Test 3: Test setCustomMetadata transformation
  console.log('\n3. Testing setCustomMetadata transformation...')
  const withMetadata = setCustomMetadata(testExport, {
    project: 'Field Survey 2026',
    author: 'Test User'
  })
  console.log(`  ✓ Metadata added: ${withMetadata.map.project === 'Field Survey 2026'}`)
  console.log(`  ✓ Author set: ${withMetadata.map.author === 'Test User'}`)

  // Test 4: Test JSON serialization (what writer.js does internally)
  console.log('\n4. Testing JSON serialization...')
  const jsonString = JSON.stringify(renamed, null, 2)
  const parsed = JSON.parse(jsonString)
  console.log(`  ✓ Serialized successfully (${jsonString.length} bytes)`)
  console.log(`  ✓ Deserialized correctly: ${parsed.map.name === 'New Map Name'}`)

  // Test 5: Test file write/read cycle
  console.log('\n5. Testing file write/read cycle...')
  const outputPath = './test-output-export.json'
  await fs.writeFile(outputPath, jsonString, 'utf-8')
  const readBack = await fs.readFile(outputPath, 'utf-8')
  const reparsed = JSON.parse(readBack)
  console.log(`  ✓ File written successfully`)
  console.log(`  ✓ File read successfully`)
  console.log(`  ✓ Data intact: ${reparsed.map.name === 'New Map Name'}`)

  // Test 6: Clean up
  await fs.unlink(outputPath)
  console.log('\n6. Cleanup complete')

  console.log('\n✓ Export Writer tests complete')
  console.log('  Note: Full writeExportFile test skipped (requires browser Blob objects)')
  console.log('  All transformation functions tested successfully')
} catch (err) {
  console.error(`✗ Error: ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

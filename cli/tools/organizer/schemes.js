/**
 * Organizer Schemes - Build archive copy plans for each organization scheme.
 *
 * @module cli/tools/organizer/schemes
 */

import path from 'path'

export const SUPPORTED_SCHEMES = [
  'by-map',
  'by-marker',
  'by-date',
  'categorized',
  'flat'
]

export const SCHEME_CHOICES = [
  {
    name: 'By Map - map directory with photos and export.json',
    value: 'by-map'
  },
  {
    name: 'By Marker - nested marker directories under map',
    value: 'by-marker'
  },
  {
    name: 'By Date - group photos by marker creation date',
    value: 'by-date'
  },
  {
    name: 'Categorized - exports/ and photos/by-map/',
    value: 'categorized'
  },
  {
    name: 'Flat - single directory with marker-prefixed photo names',
    value: 'flat'
  }
]

function sanitizeSegment (value, fallback = 'unknown') {
  const safe = String(value || fallback)
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return safe || fallback
}

function formatMarkerNumber (value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '000'
  return String(n).padStart(3, '0')
}

function toDateFolderName (value) {
  if (!value) return 'unknown-date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown-date'
  return date.toISOString().slice(0, 10)
}

function buildMarkerLookup (exportData) {
  const sorted = [...exportData.markers].sort((a, b) => {
    const aTime = new Date(a.createdDate || 0).getTime()
    const bTime = new Date(b.createdDate || 0).getTime()
    return aTime - bTime
  })

  const numbers = new Map()
  sorted.forEach((marker, index) => {
    numbers.set(marker.id, index + 1)
  })

  const markerLookup = new Map()
  for (const marker of exportData.markers) {
    markerLookup.set(marker.id, {
      id: marker.id,
      number: marker.number || numbers.get(marker.id) || 0,
      description: marker.description || 'No-Description',
      createdDate: marker.createdDate || null
    })
  }

  return markerLookup
}

function createPlanBase (scheme, outputDir) {
  return {
    scheme,
    outputDir,
    directories: new Set([outputDir]),
    files: [],
    skippedMissing: []
  }
}

function addExportFile (plan, exportPath, destination) {
  if (!exportPath) return
  plan.files.push({
    kind: 'export',
    source: exportPath,
    destination
  })
}

function addPhotoFile (plan, photo, destination) {
  if (photo.status !== 'found' || !photo.foundPath) {
    plan.skippedMissing.push(photo.filename)
    return
  }

  plan.files.push({
    kind: 'photo',
    source: photo.foundPath,
    destination,
    markerId: photo.markerId,
    markerNumber: photo.markerNumber,
    markerDescription: photo.markerDescription,
    filename: photo.filename
  })
}

export function buildOrganizationPlan ({
  manifest,
  exportData,
  outputDir,
  scheme,
  copyExport = true
}) {
  if (!SUPPORTED_SCHEMES.includes(scheme)) {
    throw new Error(`Unsupported scheme: ${scheme}`)
  }

  const plan = createPlanBase(scheme, outputDir)
  const mapName = sanitizeSegment(exportData.map?.name, 'Map')
  const markerLookup = buildMarkerLookup(exportData)
  const exportFileName = path.basename(manifest.export?.path || 'export.json')
  const foundPhotos = manifest.photos || []

  if (scheme === 'by-map') {
    const mapDir = path.join(outputDir, mapName)
    plan.directories.add(mapDir)

    if (copyExport) {
      addExportFile(plan, manifest.export?.path, path.join(mapDir, 'export.json'))
    }

    for (const photo of foundPhotos) {
      addPhotoFile(plan, photo, path.join(mapDir, photo.filename))
    }

    return plan
  }

  if (scheme === 'by-marker') {
    if (copyExport) {
      addExportFile(plan, manifest.export?.path, path.join(outputDir, 'export.json'))
    }

    for (const photo of foundPhotos) {
      const marker = markerLookup.get(photo.markerId) || {
        number: photo.markerNumber || 0,
        description: photo.markerDescription || 'No-Description'
      }

      const markerNumber = formatMarkerNumber(marker.number)
      const markerDesc = sanitizeSegment(marker.description, 'No-Description')
      const markerDirName = `marker-${markerNumber}-${markerDesc}`
      const markerDir = path.join(outputDir, mapName, markerDirName)

      plan.directories.add(path.join(outputDir, mapName))
      plan.directories.add(markerDir)
      addPhotoFile(plan, photo, path.join(markerDir, photo.filename))
    }

    return plan
  }

  if (scheme === 'by-date') {
    if (copyExport) {
      addExportFile(plan, manifest.export?.path, path.join(outputDir, 'export.json'))
    }

    for (const photo of foundPhotos) {
      const marker = markerLookup.get(photo.markerId)
      const dateFolder = toDateFolderName(marker?.createdDate || exportData.map?.createdDate)
      const dateDir = path.join(outputDir, dateFolder)
      plan.directories.add(dateDir)
      addPhotoFile(plan, photo, path.join(dateDir, photo.filename))
    }

    return plan
  }

  if (scheme === 'categorized') {
    const exportsDir = path.join(outputDir, 'exports')
    const photosDir = path.join(outputDir, 'photos', 'by-map', mapName)

    plan.directories.add(exportsDir)
    plan.directories.add(path.join(outputDir, 'photos'))
    plan.directories.add(path.join(outputDir, 'photos', 'by-map'))
    plan.directories.add(photosDir)

    if (copyExport) {
      addExportFile(plan, manifest.export?.path, path.join(exportsDir, exportFileName))
    }

    for (const photo of foundPhotos) {
      addPhotoFile(plan, photo, path.join(photosDir, photo.filename))
    }

    return plan
  }

  if (copyExport) {
    addExportFile(plan, manifest.export?.path, path.join(outputDir, 'export.json'))
  }

  for (const photo of foundPhotos) {
    const markerNumber = formatMarkerNumber(photo.markerNumber)
    const markerPrefix = `m${markerNumber}`
    const prefixedName = `${markerPrefix}-${photo.filename}`
    addPhotoFile(plan, photo, path.join(outputDir, prefixedName))
  }

  return plan
}

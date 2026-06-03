/**
 * Organizer preview helpers.
 *
 * @module cli/tools/organizer/preview
 */

import path from 'path'

export function formatPlanPreview (plan, options = {}) {
  const { maxFiles = 20 } = options

  const lines = []
  lines.push('Planned Archive Structure')
  lines.push('')
  lines.push(`Scheme: ${plan.scheme}`)
  lines.push(`Output: ${plan.outputDir}`)
  lines.push(`Directories: ${plan.directories.size}`)
  lines.push(`Files to copy: ${plan.files.length}`)

  if (plan.skippedMissing.length > 0) {
    lines.push(`Missing photos skipped: ${plan.skippedMissing.length}`)
  }

  lines.push('')
  lines.push('Files:')

  const sortedFiles = [...plan.files].sort((a, b) => {
    return a.destination.localeCompare(b.destination)
  })

  const previewFiles = sortedFiles.slice(0, maxFiles)
  for (const file of previewFiles) {
    lines.push(`  - ${path.relative(plan.outputDir, file.destination)}`)
  }

  if (sortedFiles.length > maxFiles) {
    lines.push(`  ... and ${sortedFiles.length - maxFiles} more file(s)`)
  }

  return lines.join('\n')
}

export function buildIndexHtml (archiveSummary) {
  const rows = archiveSummary.copiedFiles
    .map((item) => {
      return `<tr><td>${escapeHtml(item.kind)}</td><td>${escapeHtml(item.relativePath)}</td></tr>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SnapSpot Organizer Index</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 2rem; background: #f6f8fa; color: #1f2328; }
    .card { background: #fff; border: 1px solid #d0d7de; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #d0d7de; padding: 0.5rem; text-align: left; }
    th { background: #f0f3f6; }
    .muted { color: #59636e; }
  </style>
</head>
<body>
  <div class="card">
    <h1>SnapSpot Archive Index</h1>
    <p class="muted">Generated: ${escapeHtml(new Date().toLocaleString())}</p>
    <p><strong>Scheme:</strong> ${escapeHtml(archiveSummary.scheme)}</p>
    <p><strong>Total files:</strong> ${archiveSummary.copiedFiles.length}</p>
    <p><strong>Missing photos skipped:</strong> ${archiveSummary.missingCount}</p>
  </div>
  <div class="card">
    <h2>Files</h2>
    <table>
      <thead>
        <tr><th>Type</th><th>Path</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</body>
</html>`
}

function escapeHtml (value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

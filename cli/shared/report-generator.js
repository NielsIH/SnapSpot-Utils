/**
 * Report Generator - Generate reports in multiple formats
 *
 * Provides functions for generating text, JSON, and HTML reports.
 * Used by all CLI tools for consistent output formatting.
 *
 * @module cli/shared/report-generator
 */

import fs from 'fs/promises'
import chalk from 'chalk'

/**
 * Generate text report
 *
 * @param {Object} data - Report data
 * @param {Object} options - Report options
 * @param {boolean} [options.color=true] - Use terminal colors
 * @param {number} [options.tableWidth=80] - Table width for formatting
 * @returns {string} Formatted text report
 *
 * @example
 * const report = generateTextReport({
 *   title: 'Photo Search Results',
 *   summary: { found: 45, missing: 5 },
 *   details: [...]
 * })
 * console.log(report)
 */
export function generateTextReport (data, options = {}) {
  const {
    color = true,
    tableWidth = 80
  } = options

  const lines = []

  // Header
  if (data.title) {
    const divider = '='.repeat(tableWidth)
    lines.push(color ? chalk.bold.cyan(divider) : divider)
    lines.push(color ? chalk.bold.cyan(data.title) : data.title)
    lines.push(color ? chalk.bold.cyan(divider) : divider)
    lines.push('')
  }

  // Summary section
  if (data.summary) {
    lines.push(color ? chalk.bold('Summary:') : 'Summary:')
    lines.push('')

    for (const [key, value] of Object.entries(data.summary)) {
      const label = formatLabel(key)
      lines.push(`  ${label}: ${formatValue(value, color)}`)
    }
    lines.push('')
  }

  // Details section
  if (data.details && data.details.length > 0) {
    lines.push(color ? chalk.bold('Details:') : 'Details:')
    lines.push('')

    if (Array.isArray(data.details[0])) {
      // Table format
      lines.push(formatTable(data.details, color, tableWidth))
    } else {
      // List format
      for (const item of data.details) {
        lines.push(`  • ${item}`)
      }
    }
    lines.push('')
  }

  // Footer
  if (data.footer) {
    lines.push(color ? chalk.dim(data.footer) : data.footer)
  }

  return lines.join('\n')
}

/**
 * Generate JSON report
 *
 * @param {Object} data - Report data
 * @param {Object} options - Report options
 * @param {boolean} [options.prettyPrint=true] - Format with indentation
 * @param {boolean} [options.includeMetadata=true] - Include metadata
 * @returns {string} JSON report
 *
 * @example
 * const report = generateJsonReport({
 *   found: 45,
 *   missing: 5,
 *   files: [...]
 * })
 */
export function generateJsonReport (data, options = {}) {
  const {
    prettyPrint = true,
    includeMetadata = true
  } = options

  const reportData = { ...data }

  if (includeMetadata) {
    reportData._metadata = {
      generatedAt: new Date().toISOString(),
      generator: 'SnapSpot CLI Tools',
      version: '1.0.0'
    }
  }

  return prettyPrint
    ? JSON.stringify(reportData, null, 2)
    : JSON.stringify(reportData)
}

/**
 * Generate HTML report
 *
 * @param {Object} data - Report data
 * @param {Object} options - Report options
 * @param {string} [options.title='Report'] - HTML page title
 * @param {string} [options.theme='light'] - Color theme (light/dark)
 * @returns {string} HTML report
 *
 * @example
 * const html = generateHtmlReport({
 *   title: 'Photo Search Results',
 *   summary: { found: 45, missing: 5 },
 *   details: [['photo1.jpg', 'Found'], ['photo2.jpg', 'Missing']]
 * })
 * await fs.writeFile('report.html', html)
 */
export function generateHtmlReport (data, options = {}) {
  const {
    title = 'Report',
    theme = 'light'
  } = options

  const styles = getHtmlStyles(theme)

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(data.title || title)}</h1>
      ${data.subtitle ? `<p class="subtitle">${escapeHtml(data.subtitle)}</p>` : ''}
    </header>
`

  // Summary section
  if (data.summary) {
    html += '    <section class="summary">\n'
    html += '      <h2>Summary</h2>\n'
    html += '      <div class="summary-grid">\n'

    for (const [key, value] of Object.entries(data.summary)) {
      html += `        <div class="summary-item">
          <span class="label">${escapeHtml(formatLabel(key))}</span>
          <span class="value">${escapeHtml(String(value))}</span>
        </div>\n`
    }

    html += '      </div>\n'
    html += '    </section>\n'
  }

  // Details section
  if (data.details && data.details.length > 0) {
    html += '    <section class="details">\n'
    html += '      <h2>Details</h2>\n'

    if (Array.isArray(data.details[0])) {
      // Table format
      html += '      <table>\n'
      html += '        <thead>\n'
      html += '          <tr>\n'

      const headers = data.detailHeaders || data.details[0].map((_, i) => `Column ${i + 1}`)
      for (const header of headers) {
        html += `            <th>${escapeHtml(header)}</th>\n`
      }

      html += '          </tr>\n'
      html += '        </thead>\n'
      html += '        <tbody>\n'

      for (const row of data.details) {
        html += '          <tr>\n'
        for (const cell of row) {
          html += `            <td>${escapeHtml(String(cell))}</td>\n`
        }
        html += '          </tr>\n'
      }

      html += '        </tbody>\n'
      html += '      </table>\n'
    } else {
      // List format
      html += '      <ul>\n'
      for (const item of data.details) {
        html += `        <li>${escapeHtml(String(item))}</li>\n`
      }
      html += '      </ul>\n'
    }

    html += '    </section>\n'
  }

  // Footer
  if (data.footer) {
    html += `    <footer>
      <p>${escapeHtml(data.footer)}</p>
      <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
    </footer>\n`
  }

  html += `  </div>
</body>
</html>`

  return html
}

/**
 * Write report to file
 *
 * @param {string} content - Report content
 * @param {string} filePath - Output file path
 * @returns {Promise<void>}
 *
 * @example
 * const report = generateTextReport(data)
 * await writeReportToFile(report, './report.txt')
 */
export async function writeReportToFile (content, filePath) {
  await fs.writeFile(filePath, content, 'utf-8')
}

/**
 * Write report to stdout
 *
 * @param {string} content - Report content
 *
 * @example
 * const report = generateTextReport(data)
 * writeReportToStdout(report)
 */
export function writeReportToStdout (content) {
  console.log(content)
}

/**
 * Generate photo search results report
 *
 * @param {Object} results - Search results
 * @param {string} format - Report format (text/json/html)
 * @returns {string} Formatted report
 *
 * @example
 * const report = generatePhotoSearchReport({
 *   found: [...],
 *   missing: [...],
 *   duplicates: [...]
 * }, 'html')
 */
export function generatePhotoSearchReport (results, format = 'text') {
  const data = {
    title: 'Photo Search Results',
    subtitle: `Export: ${results.exportFile || 'Unknown'}`,
    summary: {
      totalPhotos: results.totalPhotos || 0,
      found: results.found?.length || 0,
      missing: results.missing?.length || 0,
      duplicates: results.duplicates?.length || 0,
      searchPath: results.searchPath || 'N/A',
      searchDuration: results.duration || 'N/A'
    },
    detailHeaders: ['Filename', 'Status', 'Path'],
    details: [],
    footer: 'Generated by SnapSpot CLI Tools'
  }

  // Add found photos
  if (results.found) {
    for (const photo of results.found) {
      data.details.push([photo.filename, 'Found ✓', photo.path])
    }
  }

  // Add missing photos
  if (results.missing) {
    for (const photo of results.missing) {
      data.details.push([photo.filename, 'Missing ✗', 'Not found'])
    }
  }

  if (format === 'json') {
    return generateJsonReport(data)
  } else if (format === 'html') {
    return generateHtmlReport(data)
  } else {
    return generateTextReport(data)
  }
}

/**
 * Generate export transformation report
 *
 * @param {Object} results - Transformation results
 * @param {string} format - Report format (text/json/html)
 * @returns {string} Formatted report
 */
export function generateTransformReport (results, format = 'text') {
  const data = {
    title: 'Export Transformation Results',
    summary: {
      totalFiles: results.totalFiles || 0,
      successful: results.successful || 0,
      failed: results.failed || 0,
      transformationsApplied: results.transformations?.join(', ') || 'None',
      duration: results.duration || 'N/A'
    },
    detailHeaders: ['File', 'Status', 'Transformations'],
    details: results.files?.map(f => [
      f.filename,
      f.success ? 'Success ✓' : 'Failed ✗',
      f.transformations?.join(', ') || 'None'
    ]) || [],
    footer: 'Generated by SnapSpot CLI Tools'
  }

  if (format === 'json') {
    return generateJsonReport(data)
  } else if (format === 'html') {
    return generateHtmlReport(data)
  } else {
    return generateTextReport(data)
  }
}

/**
 * Helper: Format label (camelCase to Title Case)
 */
function formatLabel (key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

/**
 * Helper: Format value with color
 */
function formatValue (value, useColor) {
  if (typeof value === 'number') {
    return useColor ? chalk.cyan(value) : String(value)
  }
  return String(value)
}

/**
 * Helper: Format table
 */
function formatTable (rows, useColor, width) {
  if (rows.length === 0) return ''

  const colWidths = []
  const numCols = rows[0].length

  // Calculate column widths
  for (let col = 0; col < numCols; col++) {
    let maxWidth = 0
    for (const row of rows) {
      maxWidth = Math.max(maxWidth, String(row[col] || '').length)
    }
    colWidths.push(maxWidth + 2)
  }

  const lines = []

  // Format rows
  for (const row of rows) {
    const cells = row.map((cell, i) =>
      String(cell || '').padEnd(colWidths[i])
    )
    lines.push('  ' + cells.join(' | '))
  }

  return lines.join('\n')
}

/**
 * Helper: Escape HTML
 */
function escapeHtml (text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Helper: Get HTML styles
 */
function getHtmlStyles (theme) {
  const isDark = theme === 'dark'

  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: ${isDark ? '#e0e0e0' : '#333'};
      background: ${isDark ? '#1e1e1e' : '#f5f5f5'};
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: ${isDark ? '#2d2d2d' : '#fff'};
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    header {
      border-bottom: 2px solid ${isDark ? '#444' : '#e0e0e0'};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: ${isDark ? '#4fc3f7' : '#2196f3'};
      font-size: 2em;
    }
    h2 {
      color: ${isDark ? '#81c784' : '#4caf50'};
      margin: 20px 0 15px 0;
      font-size: 1.5em;
    }
    .subtitle {
      color: ${isDark ? '#aaa' : '#666'};
      margin-top: 10px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 15px 0;
    }
    .summary-item {
      padding: 15px;
      background: ${isDark ? '#3a3a3a' : '#f8f9fa'};
      border-radius: 4px;
      border-left: 3px solid ${isDark ? '#4fc3f7' : '#2196f3'};
    }
    .summary-item .label {
      display: block;
      font-size: 0.9em;
      color: ${isDark ? '#aaa' : '#666'};
      margin-bottom: 5px;
    }
    .summary-item .value {
      display: block;
      font-size: 1.5em;
      font-weight: bold;
      color: ${isDark ? '#4fc3f7' : '#2196f3'};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid ${isDark ? '#444' : '#e0e0e0'};
    }
    th {
      background: ${isDark ? '#3a3a3a' : '#f8f9fa'};
      font-weight: 600;
      color: ${isDark ? '#4fc3f7' : '#2196f3'};
    }
    tr:hover {
      background: ${isDark ? '#3a3a3a' : '#f8f9fa'};
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      padding: 8px 0;
      border-bottom: 1px solid ${isDark ? '#444' : '#e0e0e0'};
    }
    li:before {
      content: "→ ";
      color: ${isDark ? '#4fc3f7' : '#2196f3'};
      font-weight: bold;
    }
    footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid ${isDark ? '#444' : '#e0e0e0'};
      color: ${isDark ? '#aaa' : '#666'};
      font-size: 0.9em;
    }
    .timestamp {
      margin-top: 10px;
      font-size: 0.85em;
      color: ${isDark ? '#888' : '#999'};
    }
  `
}

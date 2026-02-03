# SnapSpot CLI Tools

**Command-line utilities for batch operations on SnapSpot exports and photos**

Version 1.0 | Phase 7A Complete

---

## Overview

The SnapSpot CLI framework provides powerful command-line tools for batch file operations that complement the browser-based utilities. While browser tools run in sandboxed environments without file system access, CLI tools can:

- **Search directories** for original high-quality photos
- **Transform exports** in bulk (remove photos, rename, extract, etc.)
- **Organize archives** with exports and original photos
- **Process hundreds of files** with progress tracking

**Key Principle:** CLI tools are thin wrappers around `lib/snapspot-data` and `lib/snapspot-image` modules, ensuring zero code duplication between browser and CLI utilities.

---

## Installation

### Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- **SnapSpot-Utils repository** cloned locally

### Setup

```bash
cd cli
npm install
```

This will install all dependencies:
- `inquirer` - Interactive prompts
- `chalk` - Terminal colors
- `cli-progress` - Progress bars
- `glob` - File pattern matching
- `commander` - Command-line argument parsing
- `fs-extra` - Enhanced file system operations

---

## Available Tools

### 1. Photo Finder (Read-Only Validation)

**Purpose:** Find original photos referenced in exports, generate reports

**Use When:**
- Validating photos exist before archival
- Identifying missing photos for recovery  
- Creating audit logs of photo locations

**Example:**
```bash
npm run photo-finder -- --export data.json --search /photos --report validation.html
```

**Documentation:** [tools/photo-finder/README.md](tools/photo-finder/README.md)

---

### 2. Export Transformer (Batch Modification)

**Purpose:** Batch modify export files and extract embedded photos

**Use When:**
- Removing photos from exports (reduce size)
- Extracting embedded photos to JPEG files
- Renaming maps or markers in bulk
- Setting custom metadata

**Examples:**
```bash
# Remove all photos from 100 exports
npm run export-transformer -- --export "exports/*.json" --remove-photos --backup

# Extract embedded photos to organized directories
npm run export-transformer -- --export data.json --transform extractPhotos \
  --extract-photos ./photos --extract-scheme by-map
```

**Documentation:** [tools/export-transformer/README.md](tools/export-transformer/README.md)

---

### 3. Organizer (Archive Creation)

**Purpose:** Create organized archives with exports and original photos

**Use When:**
- Creating shareable archives
- Organizing projects for archival
- Creating backups with original photos
- Generating browsable photo collections

**Example:**
```bash
# Organize export and photos by marker
npm run organizer -- --export data.json --search /photos --output /archive --scheme by-marker
```

**Documentation:** [tools/organizer/README.md](tools/organizer/README.md)

---

## Architecture

### Zero Duplication Pattern

CLI tools are thin wrappers around shared libraries:

```
Browser Tools          CLI Tools
     ↓                     ↓
     └────────┬────────────┘
              ↓
    lib/snapspot-data/
    - parser.js
    - validator.js
    - writer.js
    
    lib/snapspot-image/
    - converter.js
    - hasher.js
```

**What CLI Adds:**
- File system operations (`fs.readFile`, `fs.writeFile`)
- Directory traversal
- User prompts and progress bars
- Command-line argument parsing
- Batch processing logic

**What Comes from Shared Libraries:**
- Export validation (`lib/snapspot-data/validator.js`)
- Export parsing (`lib/snapspot-data/parser.js`)
- Export writing (`lib/snapspot-data/writer.js`)
- Image conversion (`lib/snapspot-image/converter.js`)
- Hash generation (`lib/snapspot-image/hasher.js`)

### Shared Utilities

Located in `cli/shared/`, these modules are used by all CLI tools:

| Utility | Purpose | Key Functions |
|---------|---------|---------------|
| **file-finder.js** | Recursive file search | `findFilesByName()`, `findFilesByPattern()` |
| **export-loader.js** | Load/validate exports | `loadExportFile()`, `getExportSummary()` |
| **export-writer.js** | Write/transform exports | `writeExportFile()`, `modifyExport()` |
| **prompt-helpers.js** | User input prompts | `promptForFile()`, `promptForConfirmation()` |
| **progress-bar.js** | Progress display | `createProgressBar()`, `update()` |
| **report-generator.js** | Generate reports | `generateTextReport()`, `generateHtmlReport()` |

---

## Browser + CLI Workflow

**Typical Workflow:**

1. **Prototype in Browser**
   - Load export in Map Migrator
   - Test transformation on single file
   - Verify results visually

2. **Scale with CLI**
   - Use CLI to apply transformation to 100+ exports
   - Automated batch processing with progress tracking
   - Generate reports for validation

**Example:**

```bash
# Browser: Test removing photos from one export
# → Map Migrator: Load data.json, remove photos, export

# CLI: Apply to all exports in directory
npm run export-transformer -- --export "exports/*.json" --remove-photos --backup
```

---

## Creating New CLI Tools

To create a new CLI tool:

1. **Create tool directory:**
   ```
   cli/tools/my-tool/
   ├── my-tool.js       # Main entry point
   ├── logic.js         # Tool-specific logic
   └── README.md        # Tool documentation
   ```

2. **Import shared utilities:**
   ```javascript
   import { loadExportFile } from '../../shared/export-loader.js'
   import { createProgressBar } from '../../shared/progress-bar.js'
   import { promptForFile } from '../../shared/prompt-helpers.js'
   ```

3. **Use shared libraries for data operations:**
   ```javascript
   import { parseExport } from '../../../lib/snapspot-data/parser.js'
   import { validateExport } from '../../../lib/snapspot-data/validator.js'
   ```

4. **Add npm script to `package.json`:**
   ```json
   "scripts": {
     "my-tool": "node tools/my-tool/my-tool.js"
   }
   ```

5. **Follow StandardJS linting:**
   ```bash
   npm run lint:fix
   npm run lint
   ```

---

## Cross-Platform Compatibility

### Path Handling

```javascript
import path from 'path'

// CORRECT
const fullPath = path.join(baseDir, filename)

// WRONG
const fullPath = baseDir + '/' + filename  // Fails on Windows
```

### Line Endings

```javascript
import os from 'os'

// CORRECT
const lines = text.split(os.EOL)

// WRONG
const lines = text.split('\n')  // Inconsistent across platforms
```

### File Permissions

Always check file permissions before operations:
```javascript
import { access, constants } from 'fs/promises'

try {
  await access(filePath, constants.R_OK | constants.W_OK)
  // File is readable and writable
} catch {
  console.error('Permission denied')
}
```

---

## Security Considerations

### File System Access

CLI tools have **full file system access**. Always:

- ✅ Validate file paths before operations
- ✅ Use path.resolve() to prevent directory traversal
- ✅ Create backups before modifying files
- ✅ Confirm destructive operations
- ✅ Limit recursion depth in file searches

### User Input

- ✅ Sanitize all user input
- ✅ Validate file paths exist and are accessible
- ✅ Use allowlists for file patterns
- ✅ Escape shell commands if spawning processes

### Data Privacy

- ✅ Never upload exports or photos to external servers
- ✅ Process all data locally
- ✅ Warn before creating backups with sensitive data
- ✅ Respect user privacy settings

---

## Performance Guidelines

### File Search

- **Target:** <5 seconds for 100k+ files
- **Optimization:** Use exclude patterns (`node_modules`, `.git`)
- **Best Practice:** Set max depth for deep directory trees

### Batch Processing

- **Target:** <10 seconds for 100 exports
- **Optimization:** Stream large files instead of loading into memory
- **Best Practice:** Show progress bar for operations >2 seconds

### Memory Usage

- **Target:** <500MB for 10k photos
- **Optimization:** Process files in chunks
- **Best Practice:** Clear references after processing each file

---

## Troubleshooting

### npm install fails

**Cause:** Node.js version <18  
**Fix:** Update Node.js to version 18 or higher

### Permission denied errors

**Cause:** Insufficient file system permissions  
**Fix:** Run with appropriate permissions or change target directory

### Module not found errors

**Cause:** Missing dependencies  
**Fix:** Run `npm install` in `cli/` directory

### Path not found on Windows

**Cause:** Using Unix-style paths  
**Fix:** Use `path.join()` for cross-platform compatibility

---

## Contributing

When contributing to CLI tools:

1. **Use shared libraries** - Never duplicate logic from `lib/snapspot-data` or `lib/snapspot-image`
2. **Follow StandardJS** - Run `npm run lint:fix` before commits
3. **Add JSDoc comments** - Include usage examples
4. **Test cross-platform** - Verify on Windows, macOS, Linux
5. **Document new features** - Update this README and tool-specific docs

---

## Questions?

- **Main Docs:** [../README.md](../README.md)
- **Architecture:** [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **Troubleshooting:** [../docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)

---

**Last Updated:** 2026-02-03

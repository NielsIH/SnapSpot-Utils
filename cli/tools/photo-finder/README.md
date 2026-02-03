# Photo Finder - SnapSpot CLI Tool

**Find original photos referenced in SnapSpot exports**

Photo Finder is a **read-only validation tool** that searches the file system for original high-quality photos referenced in SnapSpot export files. It generates comprehensive reports and logs but **does NOT copy or modify any files**.

---

## Purpose

Use Photo Finder to:
- ✅ Verify all photos exist before creating an archive
- ✅ Generate reports of missing photos for data recovery
- ✅ Audit photo collections across multiple directories
- ✅ Create logs documenting photo locations for record-keeping
- ✅ Validate data integrity before backup or migration

**Important:** Photo Finder is **read-only**. It finds and reports on photos, but does not organize them. For archival organization, use the **Organizer** tool after validation.

---

## When to Use

**Use Photo Finder when:**
- Before running Organizer to ensure all photos are available
- To identify which photos need to be recovered from backups
- For audit trails documenting where photos are stored
- As a validation step in backup workflows

**Use Organizer instead when:**
- You've validated all photos exist and want to create an archive
- You need to copy photos into organized directory structures
- You want to generate file manifests for archival systems

---

## Installation

Photo Finder is part of the SnapSpot CLI utilities suite:

```bash
cd cli
npm install
```

---

## Usage

### Interactive Mode (Recommended)

For first-time users or occasional use, run in interactive mode:

```bash
node tools/photo-finder/photo-finder.js
```

The tool will guide you through:
1. Selecting the SnapSpot export file (`.json`)
2. Entering search directories (comma-separated)
3. Viewing search results (found/missing/duplicates)
4. Saving optional summary report (HTML/JSON/text)
5. Saving optional detailed log file

**Example Interactive Session:**

```
═════════════════════════════════════════════════
SnapSpot Photo Finder - Interactive Mode
═════════════════════════════════════════════════

? Select SnapSpot export file: ~/exports/site-survey.json

═════════════════════════════════════════════════
Export Summary
═════════════════════════════════════════════════
Map: Floor Plan 2026
Markers: 25
Photos: 100
Created: 2026-01-15

ℹ Enter directories to search (comma-separated):
? Search directories: ~/photos, ~/backup/photos

═════════════════════════════════════════════════
Searching for Photos
═════════════════════════════════════════════════
Searching ████████████████████ 100% | Files scanned: 5432

═════════════════════════════════════════════════
Search Results
═════════════════════════════════════════════════
Total Photos: 100
✓ Found: 95
⚠ Missing: 5
⚠ Duplicates: 2
Search Duration: 3s

? Save summary report? Yes
? Select report format: HTML (recommended)
? Report file path: photo-search-report.html
✓ Report saved to: photo-search-report.html

? Save detailed log file? Yes
? Log file path: photo-log.txt
✓ Log file saved to: photo-log.txt

ℹ Photos found! To organize them into an archive, use the Organizer tool.
ℹ Run: organizer --help

✓ Photo Finder complete!
```

---

### CLI Mode

For automation or scripting:

```bash
# Basic usage
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /photos

# Generate HTML report
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /photos \
  --report report.html \
  --format html

# Search multiple directories
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search "/photos,/backup/photos"

# Save detailed log file
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /photos \
  --log photo-paths.txt

# Case-sensitive search with depth limit
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /photos \
  --case-sensitive \
  --max-depth 3

# Quiet mode for scripting
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /photos \
  --report results.json \
  --format json \
  --quiet
```

---

## Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--export <path>` | Path to SnapSpot export JSON file | **Required in CLI mode** |
| `--search <paths>` | Comma-separated search directory paths | **Required in CLI mode** |
| `--report <path>` | Save summary report to file | Not saved |
| `--format <type>` | Report format: `json`, `text`, `html` | `text` |
| `--log <path>` | Save detailed log file with full paths | Not saved |
| `--case-sensitive` | Use case-sensitive filename matching | Case-insensitive |
| `--max-depth <n>` | Maximum search depth | Unlimited |
| `--quiet` | Minimal output (for scripting) | Verbose |
| `--help` | Show help message | - |

---

## Output Formats

### Summary Report

Generated with `--report` flag. Available in three formats:

**HTML (Recommended):**
- Professional presentation with styling
- Summary statistics grid
- Sortable table of all photo results
- Easy to share with stakeholders

**JSON:**
- Machine-readable format
- Use for automation or further processing
- Includes metadata and full results array

**Text:**
- Plain text for terminal output
- Human-readable format
- Good for simple logging

### Detailed Log File

Generated with `--log` flag. Text format organized by marker:

```
SnapSpot Photo Finder Log
Generated: 2026-02-03 10:30:00
Export: Site Survey 2026.json
Search Paths: /photos, /backup/photos

===== SUMMARY =====
Map: Floor 1
Total Markers: 25
Total Photos: 100
Found: 95
Missing: 5
Duplicates: 2
Search Duration: 3s

===== DETAILS =====

Map: Floor 1
  Marker #1: Entrance
    ✓ IMG_1001.jpg -> /photos/2026-01/IMG_1001.jpg
    ✓ IMG_1002.jpg -> /photos/2026-01/IMG_1002.jpg
    ✗ IMG_1003.jpg (NOT FOUND)
  
  Marker #2: Lobby
    ✓ IMG_1004.jpg -> /photos/2026-01/IMG_1004.jpg
    ⚠ IMG_1005.jpg (DUPLICATE):
      - /photos/2026-01/IMG_1005.jpg
      - /backup/photos/IMG_1005.jpg

  Marker #3: Conference Room
    ✓ IMG_1006.jpg -> /photos/2026-01/IMG_1006.jpg
    ...

===== END OF LOG =====
```

**Log file features:**
- Per-marker organization matching export structure
- Full file paths for all found photos
- Clear marking of missing photos (✗)
- Duplicate file locations listed (⚠)
- Timestamp and search metadata
- Human-readable for manual verification

---

## Search Behavior

### Case-Insensitive Matching (Default)

Photo Finder uses **case-insensitive matching** by default, which works across all platforms:

- Export references `IMG_1234.jpg`
- File on disk named `img_1234.JPG`
- ✅ Match found despite case difference

**Why?** Photo filenames can change case when:
- Transferred between Windows/Mac/iOS
- Uploaded to cloud storage
- Renamed by photo management software

Use `--case-sensitive` if you need exact case matching.

### Filename-Only Matching

Photo Finder searches **by filename only**, not by image hash.

**Why?**
- SnapSpot stores **compressed** photos in exports
- You want to find **original high-quality** photos from your camera/device
- Originals have the **same filename** but different content (uncompressed)
- Hash matching would fail for originals vs. compressed versions

**Example:**
- Original on disk: `IMG_1234.jpg` (3.2 MB, uncompressed)
- In SnapSpot export: `IMG_1234.jpg` (800 KB, compressed)
- ✅ Matched by filename, preserving original quality

### Duplicate Handling

If the same filename exists in multiple search directories:

1. Photo is marked as **found** (uses first occurrence)
2. Photo is also marked as **duplicate** in results
3. Report lists all duplicate locations
4. Log file shows all paths with ⚠ warning

**Duplicates do NOT cause failures** - the photo is considered found.

### Excluded Directories

Photo Finder automatically excludes system directories:
- `node_modules`
- `.git`, `.vscode`, `.idea`
- `$RECYCLE.BIN`, `System Volume Information`
- `.Trash`, `.DS_Store`

This prevents searching irrelevant locations and improves performance.

---

## Example Workflows

### Workflow 1: Validate Before Archival

**Goal:** Ensure all photos exist before creating an archive

```bash
# Step 1: Find photos and validate
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /photos \
  --report validation.html \
  --log photo-paths.txt

# Step 2: Review report
# - Open validation.html in browser
# - Check for missing photos

# Step 3: If all found, use Organizer
# (Only if validation passed)
node tools/organizer/organizer.js \
  --export data.json \
  --scheme by-map \
  --output /archive
```

**Exit codes:**
- `0` = All photos found (safe to proceed)
- `1` = Some photos missing (recover first)

---

### Workflow 2: Find Missing Photos

**Goal:** Generate report to identify which photos need recovery

```bash
# Generate JSON report
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /photos /backup \
  --format json \
  --report missing.json

# Parse missing.json to get filenames
# (Use jq or custom script)
jq '.details[] | select(.[1] == "Missing") | .[0]' missing.json

# Recover missing photos from backups
# ...

# Validate again
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /photos
```

---

### Workflow 3: Audit Photo Locations

**Goal:** Create detailed log documenting where each photo is located

```bash
# Generate comprehensive log
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /projects/site-survey \
  --log audit-log.txt

# Log file now contains:
# - Full path to every photo
# - Organized by marker
# - Timestamped for records
# - Human-readable for manual organization
```

Use this log for:
- Documentation of photo sources
- Manual file organization
- Audit trails for compliance
- Backup verification

---

## Exit Codes

Photo Finder uses standard exit codes:

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | Success | All photos found |
| `1` | Partial | Some photos missing |
| `2` | Error | Fatal error (file not found, invalid export, etc.) |

**Use in scripts:**

```bash
#!/bin/bash

if node tools/photo-finder/photo-finder.js --export data.json --search /photos --quiet; then
  echo "All photos found! Proceeding with archival..."
  node tools/organizer/organizer.js --export data.json --output /archive
else
  echo "Some photos missing. Please recover photos and try again."
  exit 1
fi
```

---

## Performance

**Search Speed:**
- **~100k files/second** on SSD
- **~10k files/second** on HDD

**Optimization tips:**
1. Use `--max-depth` to limit search depth if photos are shallow
2. Exclude large irrelevant directories
3. Search specific subdirectories instead of entire drive
4. Use multiple targeted searches instead of one broad search

**Example (optimized):**

```bash
# ❌ Slow (searches entire home directory)
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search ~

# ✅ Fast (searches specific photo directories)
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search ~/Photos/2026,~/Documents/Projects/Site-Survey
```

---

## Troubleshooting

### "No photos found" but photos exist

**Causes:**
1. Searching wrong directory
2. Filenames changed (renamed photos)
3. Case-sensitive mismatch (use default case-insensitive)

**Solutions:**
```bash
# Check export filenames
node tools/photo-finder/photo-finder.js --export data.json --help

# Search multiple directories
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search "/photos,/backup,/desktop"

# Use case-insensitive (default)
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /photos
```

### "Permission denied" errors

**Cause:** Insufficient permissions to read directories

**Solution:**
```bash
# Run with appropriate permissions
sudo node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /protected/directory

# Or search accessible directories only
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search ~/photos
```

Permission errors for individual files are logged but do not stop the search.

### Search too slow

**Solutions:**
1. Limit search depth: `--max-depth 5`
2. Search specific subdirectories
3. Exclude large irrelevant directories
4. Use SSD instead of HDD

### Report not saved

**Causes:**
1. Invalid file path
2. No write permissions
3. Disk full

**Solutions:**
```bash
# Use absolute path
node tools/photo-finder/photo-finder.js \
  --export data.json \
  --search /photos \
  --report /home/user/reports/report.html

# Check permissions
ls -la /path/to/report/directory

# Check disk space
df -h
```

---

## Programmatic Usage

Photo Finder can be imported and used programmatically by other tools (e.g., Organizer):

```javascript
import {
  findPhotosForExport,
  generateLogFile,
  generateInternalManifest
} from './tools/photo-finder/photo-finder.js'

// Find photos
const results = await findPhotosForExport('./data.json', '/photos', {
  caseSensitive: false,
  maxDepth: 10,
  quiet: true
})

// Check results
if (results.missing.length > 0) {
  console.error(`Missing ${results.missing.length} photos`)
  process.exit(1)
}

// Get internal manifest (for Organizer)
const manifest = generateInternalManifest(results)

// Use manifest for organization
// ...
```

---

## Comparison: Photo Finder vs. Organizer

| Feature | Photo Finder | Organizer |
|---------|--------------|-----------|
| **Purpose** | Validation | Organization |
| **Reads files** | ✅ Yes (search only) | ✅ Yes |
| **Writes files** | ❌ No (read-only) | ✅ Yes (copies photos) |
| **Reports** | ✅ Summary + detailed log | ✅ Manifest files |
| **Use when** | Before archival | After validation |
| **Exit code** | 1 if missing photos | 1 if organization fails |

**Recommended order:**
1. **Photo Finder** - Validate all photos exist
2. **Organizer** - Create organized archive
3. **Archive** - Backup organized photos

---

## FAQs

**Q: Do I need Photo Finder if I'm using Organizer?**

A: **Recommended but not required.** Photo Finder validates photos exist before organization. Organizer can also validate, but Photo Finder provides detailed logs and reports useful for troubleshooting.

**Q: Can Photo Finder organize photos into directories?**

A: **No.** Photo Finder is read-only. Use **Organizer** for file organization.

**Q: Why does it find duplicates?**

A: If the same filename exists in multiple search directories, Photo Finder reports all locations. This is useful for identifying redundant backups or accidental copies.

**Q: Does it work on Windows/Mac/Linux?**

A: **Yes.** Photo Finder works on all platforms. Case-insensitive matching handles platform-specific filename differences.

**Q: Can I search external drives?**

A: **Yes.** Provide the drive path in `--search`:
```bash
# Windows
--search "D:/Photos,E:/Backup"

# Mac/Linux
--search "/Volumes/External/Photos,/mnt/backup"
```

**Q: What if photos were renamed?**

A: Photo Finder matches **original filenames** in the export. If photos were renamed on disk, they won't be found. Check the export to see expected filenames.

---

## Additional Resources

- **Main CLI README:** `cli/README.md`
- **Phase 7B Documentation:** `docs/PHASE_7B_PHOTO_FINDER.md`
- **Organizer Tool:** `cli/tools/organizer/README.md`
- **Export Transformer Tool:** `cli/tools/export-transformer/README.md`

---

**Version:** 1.0.0  
**Part of:** SnapSpot CLI Utilities (Phase 7)  
**Last Updated:** February 3, 2026

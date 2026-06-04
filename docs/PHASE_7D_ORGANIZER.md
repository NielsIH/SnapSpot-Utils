# Phase 7D: Organizer CLI Tool

**Status:** ✅ IMPLEMENTED (core completed, testing pending)  
**Parent Phase:** Phase 7 - Node.js CLI Utilities  
**Duration:** 1 day (estimated)  
**Dependencies:** Phase 7A complete (CLI Foundation), Phase 7B complete (Photo Finder)  
**Goal:** Build tool for creating organized archives containing exports and original photos

---

## Overview

Organizer creates organized directory structures containing SnapSpot exports and original high-quality photos. It internally invokes Photo Finder for photo search, eliminating code duplication.

**Purpose:**
- Create shareable archives with exports and photos
- Organize project files for archival
- Create backups with original photos
- Generate browsable photo collections

**Key Features:**
- Multiple organization schemes (by-map, by-marker, by-date, etc.)
- Internally invokes Photo Finder (zero duplicate search logic)
- Reuses shared CLI prompts and a compact photo-search summary (no duplicated Photo Finder report UX)
- Optional HTML index for browsing
- Handles missing photos gracefully
- Creates README explaining structure

---

## Deliverables

- [x] `cli/tools/organizer/organizer.js` - Main tool
- [x] `cli/tools/organizer/schemes.js` - Organization schemes
- [x] `cli/tools/organizer/README.md` - Tool documentation
- [x] `cli/tools/organizer/preview.js` - Dry-run structure preview helpers
- [ ] Unit tests for all organization schemes
- [ ] Example workflows and usage documentation

### Additional Deliverables (beyond original plan)

- [x] `tools/organizer-ui/index.html` - Browser command generator UI
- [x] `tools/organizer-ui/ui-controller.js` - UI interactions and command generation
- [x] `tools/organizer-ui/styles.css` - Organizer UI styles
- [x] `--manifest` flag on Photo Finder CLI (save organizer manifest JSON)
- [x] `--manifest` flag on Organizer CLI (reuse Photo Finder manifest)
- [x] Manifest checkbox in Photo Finder browser UI (enabled by default)
- [x] Manifest input mode in Organizer browser UI
- [x] Launcher tile in `index.html`

---

## Tasks

### 7.3.3 Organizer Tool (`cli/tools/organizer/`)

**Core Functionality (`organizer.js`):**

- [x] Import shared libraries:
  - [x] **`lib/snapspot-data/parser.js`** - Reuse from browser utilities
  - [x] **`lib/snapspot-data/validator.js`** - Reuse from browser utilities
  - [x] `cli/shared/export-loader.js` - Wrapper around lib/snapspot-data
  - [x] `cli/shared/prompt-helpers.js`
  - [x] `cli/shared/progress-bar.js`
  - [x] `cli/shared/report-generator.js`
  - [x] `fs-extra` for directory operations
  - [x] **`cli/tools/photo-finder/photo-finder.js`** - For programmatic photo search

- [x] Implement `invokePhotoFinder(exportPath, searchPaths)`
  - [x] **Import Photo Finder as Node.js module (not spawn process)**
  - [x] Call `findPhotosForExport(exportPath, searchPaths, { quiet: true })`
  - [x] Call `generateInternalManifest(results)` with returned search results
  - [x] Receive internal manifest (not saved to disk)
  - [x] Receive search summary (found/missing/duplicates/duration)
  - [x] Return manifest with found photos and metadata
  - [x] Handle Photo Finder errors gracefully

- [x] Implement `loadManifestFile(manifestPath, exportPath)` (added beyond plan)
  - [x] Read and validate Photo Finder manifest JSON
  - [x] Align export path for copy-export operations
  - [x] Return manifest + summary matching `invokePhotoFinder` contract

- [x] Enforce **no duplicate Photo Finder UX** in Organizer:
  - [x] Do not re-implement Photo Finder report/log generation in Organizer
  - [x] Do not re-implement Photo Finder diagnostic screens/details tables
  - [x] Show compact search summary only (found/missing/duplicates)
  - [x] If detailed diagnostics are needed, direct user to run `photo-finder --report --log`
  - [x] Reuse `cli/shared/prompt-helpers.js` for all Organizer prompts

- [x] Implement organization schemes (`schemes.js`):
  - [x] `organizeByMap(exportData, foundPhotos, outputDir)`
    - [x] Structure: `{outputDir}/{mapName}/export.json` + photos
  - [x] `organizeByMarker(exportData, foundPhotos, outputDir)`
    - [x] Structure: `{outputDir}/{mapName}/{markerNumber}-{description}/` + photos
  - [x] `organizeByDate(exportData, foundPhotos, outputDir)`
    - [x] Structure: `{outputDir}/YYYY-MM-DD/` (by creation date)
  - [x] `organizeCategorized(exportData, foundPhotos, outputDir)`
    - [x] Structure: `{outputDir}/exports/`, `{outputDir}/photos/by-map/`, etc.
  - [x] `organizeFlat(exportData, foundPhotos, outputDir)`
    - [x] All in one directory with prefixes

- [x] Implement core operations:
  - [x] Create directory structure for chosen scheme
  - [x] Copy export file to appropriate location(s)
  - [x] Copy found photos to appropriate location(s)
  - [x] Handle filename collisions (append number, deterministic)
  - [x] Create README.txt in output directory explaining structure
  - [x] Optionally create index.html for browsing

- [x] Implement interactive mode:
  - [x] Prompt for export file path
  - [x] Prompt for photo source: search directories OR existing manifest (added beyond plan)
  - [x] Prompt for photo search directory(ies)
  - [x] **Invoke Photo Finder to search for photos (internal manifest)**
  - [x] Display found/missing summary from Photo Finder
  - [x] Prompt for organization scheme (with descriptions)
  - [x] Prompt for output directory
  - [x] Preview directory structure
  - [x] Confirm before creating
  - [x] Copy files with progress bar
  - [x] Generate completion report

- [x] Implement CLI mode with flags:
  - [x] `--export <path>` - Export file path
  - [x] `--search <paths>` - Photo search directories (comma-separated, same contract as Photo Finder CLI)
  - [x] `--manifest <path>` - Photo Finder manifest JSON (alternative to --search, added beyond plan)
  - [x] `--output <path>` - Output directory
  - [x] `--scheme <by-map|by-marker|by-date|categorized|flat>` - Organization scheme
  - [x] `--create-index` - Generate browsable HTML index
  - [x] `--copy-export` - Include export file in archive
  - [x] `--missing-ok` - Proceed even if Photo Finder reports missing photos
  - [x] `--dry-run` - Show structure without creating
  - [x] `--report <path>` - Save report

**Documentation (`README.md`):**

- [x] Tool overview and use cases (archival, sharing, backup)
- [x] All organization schemes explained
- [x] Interactive mode walkthrough
- [x] CLI mode examples (including --manifest workflow)
- [x] **How Organizer invokes Photo Finder internally**
- [x] Use case examples:
  - [x] Creating shareable archive with photos
  - [x] Organizing project files for archival
  - [x] Creating backup with original photos
  - [x] **Validating export before organizing (run Photo Finder first)**
- [x] Troubleshooting section

---

## Example Workflows

**Workflow 1: Organize Export with Photos**
```bash
# Organizer automatically invokes Photo Finder to search for photos
organizer --export data.json --search /photos --output /archive --scheme by-marker
```

**Workflow 2: Validate Before Organizing**
```bash
# First, validate photos exist (Photo Finder read-only mode)
photo-finder --export data.json --search /photos --report validation.html

# Review validation report, then organize
organizer --export data.json --search /photos --output /archive --scheme by-map
```

**Workflow 3: Organize with Multiple Search Paths**
```bash
# Organizer passes all search paths to Photo Finder
organizer --export data.json --search "/photos,/backup,/external" \
  --output /archive --scheme by-date
```

**Workflow 4: Create Browsable Archive**
```bash
# Generate HTML index for browsing
organizer --export data.json --search /photos --output /archive \
  --scheme by-map --create-index
# Open /archive/index.html in browser
```

**Workflow 5: Reuse Photo Finder Manifest (no repeated search)**
```bash
# Step 1: Photo Finder saves manifest (with default --manifest flag)
photo-finder --export data.json --search /photos --manifest

# Step 2: Organizer reuses manifest, skipping redundant search
organizer --export data.json --manifest ./output/MyMap_photo_manifest.json \
  --output /archive --scheme by-marker
```

---

## Acceptance Criteria

- [x] All organization schemes create correct structures
- [x] Directory names are filesystem-safe
- [x] Handles filename collisions gracefully (deterministic suffix)
- [x] Creates comprehensive README in archive
- [x] Optional HTML index is browsable
- [x] Dry-run shows accurate preview
- [x] Works with partial photo matches (missing photos handled)
- [x] Reports show complete archive structure
- [x] Works in both interactive and CLI modes
- [x] **Invokes Photo Finder internally for photo search (no duplicate code)**
- [x] **Supports manifest JSON as alternative to search directories (no repeated search)**
- [x] **Passes search directories to Photo Finder correctly**
- [x] **Handles Photo Finder errors gracefully**
- [x] **Does not duplicate Photo Finder report/log UX (Organizer only shows compact summary)**

---

## Testing Plan

### Unit Tests

**Scenario 15: Organize by Map**
- [ ] Export with 1 map, 15 photos total
- [ ] Organizer invokes Photo Finder to search
- [ ] Photo Finder finds all photos
- [ ] Choose organize-by-map scheme
- [ ] Creates 1 directory (for export map)
- [ ] Photos and export in correct locations
- [ ] README.txt created

**Scenario 16: Organize by Marker**
- [ ] Export with 10 markers
- [ ] Choose organize-by-marker scheme
- [ ] Creates nested structure: map/marker directories
- [ ] All photos in correct marker directories
- [ ] Marker directories named correctly

**Scenario 17: Missing Photos Handling**
- [ ] Export with 10 photos, only 6 found by Photo Finder
- [ ] Choose --missing-ok flag
- [ ] Organizer proceeds with 6 photos
- [ ] Report shows 4 missing
- [ ] Archive complete with available photos

**Scenario 18: Filename Collisions**
- [ ] Two photos named "photo.jpg" in different markers
- [ ] Organize with flat scheme
- [ ] Tool renames one to "photo-1.jpg"
- [ ] Both photos copied, no data loss

**Scenario 19: HTML Index Creation**
- [ ] Use --create-index flag
- [ ] index.html created in output directory
- [ ] HTML file opens in browser
- [ ] Shows browsable archive structure

**Scenario 20: Photo Finder Integration**
- [ ] Organizer invokes Photo Finder internally
- [ ] Photo Finder searches correctly
- [ ] Organizer receives internal manifest
- [ ] Photos organized based on Photo Finder results
- [ ] No files written by Photo Finder (internal only)

**Scenario 21: No-Duplicate-UX Contract**
- [ ] Run Organizer interactive mode with missing photos
- [ ] Organizer shows compact summary (found/missing/duplicates)
- [ ] Organizer does not generate Photo Finder-style diagnostics tables/log content
- [ ] Organizer suggests `photo-finder --report --log` for full diagnostics

### Performance Tests
- [ ] Organize 1000 photos: <30 seconds
- [ ] Directory structure creation: <1 second
- [ ] HTML index for 1000 photos: <2 seconds

---

## Organization Scheme Examples

Note: Current CLI flow processes one export per run (single map per export). Examples below are illustrative for directory shape.

### by-map
```
/archive/
  Floor-1/
    export.json
    IMG_1001.jpg
    IMG_1002.jpg
  Floor-2/
    export.json
    IMG_2001.jpg
  README.txt
```

### by-marker
```
/archive/
  Floor-1/
    marker-001-Entrance/
      IMG_1001.jpg
      IMG_1002.jpg
    marker-002-Lobby/
      IMG_1003.jpg
  Floor-2/
    marker-003-Office/
      IMG_2001.jpg
  export.json
  README.txt
```

### by-date
```
/archive/
  2026-01-15/
    IMG_1001.jpg
    IMG_1002.jpg
  2026-01-16/
    IMG_1003.jpg
    IMG_2001.jpg
  export.json
  README.txt
```

### categorized
```
/archive/
  exports/
    Site-Survey-2026.json
  photos/
    by-map/
      Floor-1/
        IMG_1001.jpg
        IMG_1002.jpg
      Floor-2/
        IMG_2001.jpg
  README.txt
```

### flat
```
/archive/
  export.json
  IMG_1001.jpg
  IMG_1002.jpg
  IMG_1003.jpg
  IMG_2001.jpg
  README.txt
```

---

## Implementation Notes

### Photo Finder Integration

```javascript
import {
  findPhotosForExport,
  generateInternalManifest
} from '../photo-finder/photo-finder.js'

async function searchForPhotos(exportPath, searchPaths) {
  try {
    // Invoke Photo Finder programmatically (not spawn)
    const results = await findPhotosForExport(exportPath, searchPaths, {
      quiet: true
    })

    const manifest = generateInternalManifest(results)
    
    // No files written - manifest is in-memory only
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
```

### UX Boundary (Photo Finder vs Organizer)

- Photo Finder remains the detailed diagnostics tool (reports, logs, deep missing-photo analysis).
- Organizer remains the archive construction tool (scheme selection, copy operations, archive README/index).
- Organizer shows only a compact photo-search summary and asks whether to continue.
- Detailed validation UX is intentionally delegated to Photo Finder to avoid duplicated prompt/report maintenance.

### README.txt Template

```
SnapSpot Archive
Created: 2026-02-03 10:30:00
Organization Scheme: by-marker

This archive contains:
- SnapSpot export file: export.json
- Original high-quality photos organized by marker
- HTML index for browsing: index.html

Directory Structure:
/Floor-1/
  /marker-001-Entrance/
    - Photo files for marker 1
  /marker-002-Lobby/
    - Photo files for marker 2
/Floor-2/
  /marker-003-Office/
    - Photo files for marker 3

Total Maps: 1
Total Markers: 25
Total Photos: 100

To view this archive:
1. Open index.html in a web browser
2. Or navigate the directories above
```

---

## Next Steps

After completing Phase 7D:
- Proceed to [Phase 7E: Testing & Polish](PHASE_7E_TESTING_POLISH.md)
- Remaining work: unit tests for all organization schemes
- All three CLI tools complete
- Ready for comprehensive testing

---

## Post-Completion Changes

### 2026-06-03 — Manifest Workflow & Browser UI

**Description:** Added Photo Finder manifest support and browser UI for Organizer to enable a "search once, organize repeatedly" workflow. Users can run Photo Finder once with `--manifest`, then feed the resulting JSON to Organizer via `--manifest` instead of repeating search paths.

**Files Modified:**
- `cli/tools/photo-finder/photo-finder.js` — Added `--manifest` flag, saves `generateInternalManifest()` output as JSON
- `cli/tools/organizer/organizer.js` — Added `--manifest` flag, `loadManifestFile()` function, input mode choice in interactive mode
- `cli/tools/organizer/README.md` — Documented manifest workflow

**Files Created:**
- `tools/organizer-ui/index.html` — Browser command generator UI
- `tools/organizer-ui/ui-controller.js` — UI controller with config prefill, manifest/search mode toggle
- `tools/organizer-ui/styles.css` — Organizer UI styles

**Files Modified (UI integration):**
- `tools/photo-finder-ui/index.html` — Added "Save organizer manifest" checkbox (default: checked)
- `tools/photo-finder-ui/ui-controller.js` — Wired manifest checkbox into command generation
- `index.html` — Added Organizer tile to launcher

**Testing Status:** CLI help verified, lint clean, browser pages open locally. Unit tests pending.

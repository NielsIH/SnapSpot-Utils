# Phase 7C: Export Transformer Tool (CLI + Browser UI)

**Status:** ⏳ PLANNED  
**Parent Phase:** Phase 7 - Node.js CLI Utilities  
**Duration:** 2 days (estimated)  
**Dependencies:** Phase 7A complete (CLI Foundation established)  
**Goal:** Build CLI tool and browser UI for batch modification of SnapSpot export files and photo extraction

---

## Overview

Export Transformer provides both a **Node.js CLI tool** and a **browser-based UI** for batch modification of SnapSpot export files with operations like:
- **Removing embedded photo data** (strips `imageData` property only, keeps photo objects for local serving)
- **Extracting embedded Base64 photos to JPEG files** (with optional filename filtering)
- **Splitting markers** with multiple photos into individual markers (one photo per marker)
- Batch processing multiple exports with same transformations
- *(Future)* Renaming/removing maps and markers in bulk
- *(Future)* Setting custom metadata (CLI only, not used by SnapSpot PWA)
- *(Future)* Format transformation to other applications using mapping files

**Architecture:**
- **CLI Tool** (`cli/tools/export-transformer/`) - Standalone Node.js tool for automation
- **Browser UI** (`tools/export-transformer-ui/`) - Interactive command builder and configuration manager

**Browser UI Features:**
- Interactive transformation configuration
- Pre-populated paths from localStorage configuration
- Command builder (generates full CLI command)
- Integration with photo-finder output (filter photos to extract)
- Preview and execute transformations in-browser
- Export configured command for terminal use

**CLI Features:**
- Dry-run mode for preview
- Automatic backups
- Batch processing with glob patterns
- Chain multiple transformations
- Extract photos while preserving reference data
- Filter photos by filename list (integrates with photo-finder output)

---

## Implementation Priorities

**Phase 7C Focus (Core Functionality):**
1. ✅ **Photo Extraction** - Extract embedded Base64 photos to JPEG files
   - Multiple organization schemes
   - Optional filename filtering (photo-finder integration)
   - Hash verification
2. ✅ **Photo Data Removal** - Strip `imageData` property only (keep photo objects for metadata)
   - Enables local high-quality photo serving in SnapSpot PWA
   - Reduces export file size while preserving photo references
3. ✅ **Marker Splitting** - Split markers with multiple photos into individual markers
   - Better field documentation workflow
   - Creates stacked markers (same coordinates)
   - Meaningful descriptions for each photo
4. ✅ **Browser UI** - Command builder and configuration manager
5. ✅ **Batch Processing** - Process multiple exports with same transformations

**Placeholder Implementations (CLI only, not in UI):**
- `renameMap()` - Basic single map rename
- `removeMap()` - Remove map and markers
- `setCustomMetadata()` - Add custom properties (not used by SnapSpot PWA)
- **Rationale:** Individual operations can be done in SnapSpot app. Future phases will determine useful patterns for bulk operations.

**Future Phases:**
- **Bulk renaming/removal patterns** - Determine useful batch operations (regex, templates, etc.)
- **Format transformation** - Transform SnapSpot JSON to other formats using mapping files
- **Advanced metadata** - Support for custom fields in other applications
- **SnapSpot PWA - Stacked markers UI** - Implement circular spread or modal list for accessing stacked markers

---

## Deliverables

**CLI Tool:**
- [ ] `cli/tools/export-transformer/export-transformer.js` - Main CLI tool
- [ ] `cli/tools/export-transformer/transformations.js` - Transformation operations
- [ ] `cli/tools/export-transformer/README.md` - CLI tool documentation
- [ ] Unit tests for all transformations

**Browser UI:**
- [ ] `tools/export-transformer-ui/index.html` - Browser UI entry point
- [ ] `tools/export-transformer-ui/ui-controller.js` - UI interactions and command builder
- [ ] `tools/export-transformer-ui/styles.css` - UI-specific styles
- [ ] Integration with `shared/utils/config-manager.js` for configuration
- [ ] Manual testing procedures for browser UI

---

## Tasks

### 7.3.1 Browser UI (`tools/export-transformer-ui/`)

**User Interface (`index.html + ui-controller.js`):**

- [ ] Import shared utilities:
  - [ ] `shared/utils/config-manager.js` - Load/save configuration
  - [ ] `shared/utils/file-loader.js` - For export file selection
  - [ ] `lib/snapspot-data/parser.js` - Parse loaded exports
  - [ ] `lib/snapspot-data/validator.js` - Validate exports

- [ ] Implement UI sections:
  - [ ] **Export File Selection:**
    - [ ] File input for single export
    - [ ] Pattern input for multiple exports (with preview)
    - [ ] Pre-populate from configuration (`paths.exportsDir`)
    - [ ] Display loaded export summary (maps, markers, photos count)
  
  - [ ] **Transformation Configuration:**
    - [ ] Checkbox list of available transformations:
      - [ ] Remove Photo Data (imageData only)
      - [ ] Extract Photos to Files
      - [ ] Split Markers with Multiple Photos
    - [ ] Configuration panel for each transformation:
      - [ ] **Remove Photo Data:** Simple checkbox (no additional options)
      - [ ] **Extract Photos:** 
        - [ ] Directory input (pre-populate from config)
        - [ ] Organization scheme selector
        - [ ] Marker naming preference
        - [ ] Filename filter (optional)
      - [ ] **Split Markers:**
        - [ ] Description template input (e.g., "{original} - Photo {number}")
        - [ ] Preview: Show markers that will be split (count)
  
  - [ ] **Photo Extraction Configuration:**
    - [ ] Output directory input (pre-populate from `paths.photosDir`)
    - [ ] Organization scheme selector:
      - [ ] By map (`by-map`)
      - [ ] By marker with description as folder name (`by-marker-description`)
      - [ ] By marker with chronological number as folder name (`by-marker-number`)
      - [ ] Flat directory (`flat`)
    - [ ] Marker folder naming options:
      - [ ] Use marker description (sanitized for filenames)
      - [ ] Use sequential number (calculated from createdDate sort)
    - [ ] Optional filename filter:
      - [ ] Text area for filename list (one per line)
      - [ ] Import from photo-finder report
      - [ ] Auto-populated from photo-finder UI if available
      - [ ] Example: Extract only photos matching specific names
    - [ ] Extract-and-remove checkbox (remove from export after extraction)
  
  - [ ] **Options:**
    - [ ] Backup checkbox (create .bak before modifying)
    - [ ] Dry-run checkbox (preview only)
    - [ ] Output directory for modified exports (optional)
  
  - [ ] **Command Builder:**
    - [ ] Generate full CLI command with all configured parameters
    - [ ] Copy-to-clipboard button
    - [ ] Display command in code block with syntax highlighting
    - [ ] Syntax: `node cli/tools/export-transformer/export-transformer.js [options]`
  
  - [ ] **Preview Panel:**
    - [ ] Show what will be modified (maps, markers, photos affected)
    - [ ] For photo extraction: List photos that will be extracted
    - [ ] For batch: Show affected files count

- [ ] Implement configuration integration:
  - [ ] Load configuration on page load
  - [ ] Pre-populate paths from configuration
  - [ ] Link to configuration page (`/tools/config/`)
  - [ ] Show "Configure paths" notice if configuration is incomplete

- [ ] Implement photo-finder integration:
  - [ ] Import photo-finder report (CSV or JSON)
  - [ ] Parse missing photo filenames
  - [ ] Auto-populate filename filter for extraction
  - [ ] Example workflow: Find missing photos → Extract those photos from export

**Styling (`styles.css`):**

- [ ] Follow utility.css patterns
- [ ] Responsive layout for transformation panels
- [ ] Clear visual hierarchy for multi-step workflow
- [ ] Command output styling (monospace, code block)

### 7.3.2 CLI Tool (`cli/tools/export-transformer/`)

**Core Functionality (`export-transformer.js`):**

- [ ] Import shared libraries:
  - [ ] **`lib/snapspot-data/parser.js`** - Reuse from browser utilities
  - [ ] **`lib/snapspot-data/validator.js`** - Reuse from browser utilities
  - [ ] **`lib/snapspot-data/writer.js`** - Reuse from browser utilities
  - [ ] **`lib/snapspot-image/converter.js`** - For photo extraction
  - [ ] `cli/shared/export-loader.js` - Wrapper around lib/snapspot-data
  - [ ] `cli/shared/export-writer.js` - Wrapper around lib/snapspot-data
  - [ ] `cli/shared/prompt-helpers.js`
  - [ ] `cli/shared/report-generator.js`

- [ ] Implement core transformation operations (`transformations.js`):
  - [ ] **`removePhotoData(exportData)`** - Strip `imageData` property for smaller files:
    - [ ] Remove `imageData` from all photo objects in the export
    - [ ] **Keep photo objects** with metadata (`id`, `filename`, `imageHash`, `markerId`, `createdDate`)
    - [ ] Enables SnapSpot PWA to serve photos from local directory
    - [ ] Export remains valid, just without embedded Base64 data
    - [ ] **Note:** Each export contains exactly one map, so no map filtering needed
  - [ ] **`extractPhotosToFiles(exportData, outputDir, options)`** - Extract embedded photos:
    - [ ] Read photo data (base64) from export
    - [ ] Calculate marker numbers (sort all markers by createdDate, assign sequential numbers)
    - [ ] **Optional filename filter:** Extract only photos matching provided list
    - [ ] Convert base64 to image blobs using `lib/snapspot-image/converter.js`
    - [ ] Save as JPEG files with original filenames
    - [ ] **Organize in subdirectories with configurable marker naming:**
      - [ ] `by-map` - Group by map name
      - [ ] `by-marker-description` - Group by map/marker description
      - [ ] `by-marker-number` - Group by map/marker chronological number
      - [ ] `flat` - All photos in one directory
    - [ ] Generate mapping file (photo ID → filename → extracted path)
    - [ ] Verify extraction with hash validation
  - [ ] **`splitMarkersWithMultiplePhotos(exportData, options)`** - Split markers into individual markers:
    - [ ] Find all markers with 2+ photos
    - [ ] For each multi-photo marker:
      - [ ] Keep first photo in original marker
      - [ ] Create new markers for remaining photos (same position x/y)
      - [ ] Generate new UUIDs for new markers
      - [ ] Copy marker description or prompt for new descriptions
      - [ ] Preserve all other marker properties
      - [ ] Update createdDate to maintain chronological order
    - [ ] Options: description template (e.g., "Original - Photo 1", "Original - Photo 2")
    - [ ] Return report of splits performed

- [ ] Implement placeholder transformations (basic functionality, not in UI):
  - [ ] `renameMap(exportData, oldName, newName)` - Rename single map
  - [ ] `removeMap(exportData, mapName)` - Remove map and all markers
  - [ ] `setCustomMetadata(exportData, metadata)` - Add custom properties (not used by SnapSpot PWA)
  - [ ] **Note:** These are placeholders for potential future bulk operations
  - [ ] Individual renaming/removal can be done in SnapSpot app - these would be for bulk/batch use cases
  - [ ] Will determine useful patterns for bulk operations in future phases

- [ ] Implement marker number calculation:
  - [ ] **Markers are NOT numbered in export file**
  - [ ] Numbers calculated on-the-fly: Sort all markers by `createdDate` (ascending)
  - [ ] Assign sequential numbers starting from 1
  - [ ] Use for folder naming when `--marker-naming number` is specified
  - [ ] Helper function: `calculateMarkerNumbers(markers)`

- [ ] Implement batch processing:
  - [ ] Process single export file
  - [ ] Process multiple export files (glob patterns)
  - [ ] Apply same transformations to all files
  - [ ] Create backups before modification (optional)

- [ ] Implement interactive mode:
  - [ ] Prompt for export file(s) or pattern
  - [ ] Display available transformations (checkbox list)
  - [ ] Configure each transformation (prompts for parameters)
  - [ ] Preview changes (show what will be modified)
  - [ ] Confirm before applying
  - [ ] Apply transformations with progress tracking
  - [ ] Show results report

- [ ] Implement CLI mode with flags:
  - [ ] `--export <path|pattern>` - Export file(s) to transform
  - [ ] `--transform <name>` - Transformation to apply (can be repeated)
  - [ ] `--backup` - Create backup before modifying
  - [ ] `--dry-run` - Show changes without applying
  - [ ] `--output-dir <path>` - Save modified exports to different directory
  - [ ] `--report <path>` - Save transformation report
  - [ ] Core transformation flags:
    - [ ] `--remove-photo-data` - Strip imageData property from all photos
    - [ ] `--extract-photos <dir>` - Extract embedded photos to directory
    - [ ] `--extract-scheme <by-map|by-marker-description|by-marker-number|flat>` - Organization for extracted photos
    - [ ] `--marker-naming <description|number>` - How to name marker folders (default: description)
    - [ ] `--photo-filter <file>` - Text file with photo filenames to extract (one per line)
    - [ ] `--split-markers` - Split markers with multiple photos into individual markers
    - [ ] `--split-description-template <template>` - Template for new marker descriptions (default: "{original} - Photo {number}")
  - [ ] Placeholder transformation flags (basic implementation, not in UI):
    - [ ] `--rename-map <old>:<new>` - Rename map
    - [ ] `--remove-map <name>` - Remove map
    - [ ] `--set-metadata <key>:<value>` - Set custom metadata (not used by SnapSpot PWA)

**Documentation (`README.md`):**

- [ ] Tool overview and use cases
- [ ] List of all available transformations
- [ ] Interactive mode walkthrough
- [ ] CLI mode examples for common tasks
- [ ] How to chain multiple transformations
- [ ] Photo extraction documentation
- [ ] Safety features (backups, dry-run)
- [ ] Troubleshooting section

---

## Example Workflows

**Workflow 1: Remove Embedded Photo Data**
```bash
# Remove imageData from all photos (keeps photo objects with metadata)
node export-transformer.js --export my-site.json --transform removePhotoData
# Result: Export size reduced, photo objects remain for local serving

# Use case: Extract photos, remove imageData, serve from local directory
node export-transformer.js --export my-site.json \
  --transform extractPhotos --extract-photos ./photos \
  --transform removePhotoData --backup
# Result: Photos extracted to ./photos, export has metadata only, SnapSpot serves from ./photos
```

**Workflow 2: Extract Embedded Photos**
```bash
# Extract all photos organized by map
node export-transformer.js --export my-site.json --transform extractPhotos \
  --extract-photos ./photos --extract-scheme by-map
# Creates: ./photos/Floor-1/marker-001-photo-001.jpg

# Extract organized by marker (using description for folder name)
node export-transformer.js --export my-site.json --transform extractPhotos \
  --extract-photos ./photos --extract-scheme by-marker-description \
  --marker-naming description
# Creates: ./photos/Floor-1/Front-Entrance/photo-001.jpg

# Extract organized by marker (using chronological number for folder name)
node export-transformer.js --export my-site.json --transform extractPhotos \
  --extract-photos ./photos --extract-scheme by-marker-number \
  --marker-naming number
# Creates: ./photos/Floor-1/marker-001/photo-001.jpg

# Extract to flat directory
node export-transformer.js --export my-site.json --transform extractPhotos \
  --extract-photos ./photos --extract-scheme flat

# Extract photos and remove imageData from export (reduce export size)
node export-transformer.js --export my-site.json --transform extractPhotos \
  --extract-photos ./photos --transform removePhotoData
# Result: Photos in ./photos, export keeps photo metadata only
```

**Workflow 3: Extract Missing Photos (Photo-Finder Integration)**
```bash
# Step 1: Find missing photos with photo-finder
node photo-finder.js --export my-site.json --photos-dir ./all-photos --report missing.txt
# Output: missing.txt contains list of missing photo filenames

# Step 2: Extract ONLY those missing photos from export
node export-transformer.js --export my-site.json --transform extractPhotos \
  --extract-photos ./recovered --photo-filter missing.txt \
  --extract-scheme by-marker-number
# Extracts only the photos listed in missing.txt
# Useful for recovering photos that were accidentally deleted from disk
```

**Workflow 4: Split Markers with Multiple Photos**
```bash
# Split all markers that have multiple photos
node export-transformer.js --export my-site.json --transform splitMarkers
# Original marker keeps first photo, new markers created for remaining photos
# Default description template: "{original description} - Photo {number}"
# Note: Creates markers at same coordinates (stacked markers)

# Use custom description template
node export-transformer.js --export my-site.json --transform splitMarkers \
  --split-description-template "{original} ({number})"
# Example: "Front Entrance" → "Front Entrance (1)", "Front Entrance (2)"

# Split and extract photos, remove imageData in one operation
node export-transformer.js --export my-site.json \
  --transform splitMarkers \
  --transform extractPhotos --extract-photos ./photos \
  --transform removePhotoData
# Result: Each marker has one photo, photos extracted to files, export size reduced
```

**Workflow 5: Batch Transform Multiple Exports**
```bash
# Remove photo data from all exports in directory (each export = 1 map)
node export-transformer.js --export "./exports/*.json" --transform removePhotoData \
  --output-dir ./cleaned

# Extract photos from multiple exports
node export-transformer.js --export "./exports/*.json" --transform extractPhotos \
  --extract-photos ./all-photos --extract-scheme by-map
```

**Workflow 6: Chain Multiple Transformations**
```bash
# Split markers, then extract photos, remove imageData from export
node export-transformer.js --export my-site.json \
  --transform splitMarkers \
  --transform extractPhotos --extract-photos ./photos \
  --transform removePhotoData --backup
# Result: Each marker has one photo with meaningful description, photos extracted to files
```

**Workflow 7: Browser UI - Command Builder**
```
1. Open tools/export-transformer-ui/ in browser
2. Select export file: ./my-site.json
3. Check "Extract Photos" transformation
4. Configure extraction:
   - Output: ./recovered-photos (pre-filled from config)
   - Scheme: by-marker-number
   - Marker naming: number
5. Import photo-finder report (missing.txt)
6. Click "Generate Command"
7. Copy generated command:
   node export-transformer.js --export ./my-site.json \
     --transform extractPhotos --extract-photos ./recovered-photos \
     --extract-scheme by-marker-number --marker-naming number \
     --photo-filter missing.txt
8. Run command in terminal
```

---

## Acceptance Criteria

**CLI Tool:**
- [ ] All transformations work correctly
- [ ] Can apply multiple transformations in sequence
- [ ] Dry-run mode shows accurate preview
- [ ] Backups created when requested
- [ ] Batch processing works for multiple files
- [ ] Modified exports are valid (pass validation)
- [ ] Reports show all changes made
- [ ] Works in both interactive and CLI modes
- [ ] **Photo extraction creates valid JPEG files**
- [ ] **Extracted photos match original embedded data (hash verification)**
- [ ] **Photo data removal strips only `imageData` property**
- [ ] **Photo objects remain with complete metadata after data removal**
- [ ] **All organization schemes work correctly** (by-map, by-marker-description, by-marker-number, flat)
- [ ] **Marker numbers calculated correctly** (chronological by createdDate)
- [ ] **Filename filtering works** (extracts only specified photos)
- [ ] **Photo-filter file parsed correctly** (one filename per line)
- [ ] **Marker splitting works correctly:**
  - [ ] Markers with 2+ photos split into individual markers
  - [ ] New markers have unique IDs and correct positions (same x,y as original)
  - [ ] Description template applied correctly
  - [ ] Chronological order maintained
- [ ] **Placeholder transformations have basic implementation** (rename/remove map, set metadata)

**Browser UI:**
- [ ] Loads and parses export files correctly
- [ ] All transformation options available in UI
- [ ] Configuration values pre-populate paths
- [ ] Command builder generates valid CLI commands
- [ ] Photo-finder report import works
- [ ] Preview shows accurate transformation results
- [ ] Copy-to-clipboard works for generated commands
- [ ] Responsive layout for all screen sizes
- [ ] Clear error messages for invalid inputs
- [ ] Link to configuration page works

---

## Testing Plan

### Unit Tests (CLI Tool)

**Scenario 1: Remove Photo Data (imageData only)**
- [ ] Export with 50 photos (large file)
- [ ] Apply removePhotoData transformation
- [ ] Result file much smaller
- [ ] Maps and markers intact
- [ ] **Photo objects remain** with all metadata
- [ ] Only `imageData` property removed from each photo
- [ ] Export still valid (passes validation)
- [ ] Photo objects have: `id`, `filename`, `imageHash`, `markerId`, `createdDate`

**Scenario 2: Placeholder Transformations (Basic Implementation)**
- [ ] Export with multiple maps
- [ ] Apply renameMap (single map rename)
- [ ] Verify map name changed
- [ ] Apply removeMap
- [ ] Verify map and all markers removed
- [ ] Apply setCustomMetadata
- [ ] Verify metadata added to export
- [ ] **Note:** These are not in UI - CLI only for now

**Scenario 3: Batch Transformation**
- [ ] 3 export files in directory
- [ ] Apply same transformation to all
- [ ] All files modified correctly
- [ ] Backups created for all files

**Scenario 4: Dry-Run Mode**
- [ ] Run transformation with --dry-run
- [ ] Shows what would change
- [ ] No files actually modified
- [ ] Report accurate preview

**Scenario 5: Split Markers with Multiple Photos**
- [ ] Export with 5 markers, 3 have multiple photos (2, 3, 4 photos each)
- [ ] Apply splitMarkers transformation
- [ ] Original markers keep first photo
- [ ] New markers created: 1 + 2 + 3 = 6 new markers
- [ ] Total markers after split: 5 + 6 = 11 markers
- [ ] All new markers have correct position (same as original)
- [ ] All new markers have unique IDs (UUID format)
- [ ] Description template applied: "{original} - Photo {number}"
- [ ] createdDate incremented to maintain chronological order

**Scenario 5a: Chain Split and Extract**
- [ ] Export with markers having multiple photos
- [ ] Chain: splitMarkers → extractPhotos → removePhotoData
- [ ] All markers now have single photo
- [ ] Photos extracted to JPEG files
- [ ] Export has photo metadata only (no imageData)
- [ ] Export file size reduced
- [ ] All operations applied correctly

**Scenario 6: Extract Photos (by-map)**
- [ ] Export with 3 maps, 20 embedded photos (Base64)
- [ ] Apply extractPhotos transformation
- [ ] Use --extract-scheme by-map
- [ ] Creates 3 directories (one per map)
- [ ] All 20 photos extracted as JPEG files
- [ ] Original filenames preserved
- [ ] Mapping file created (photo ID → filename → path)

**Scenario 7: Extract Photos (by-marker-description)**
- [ ] Export with 10 markers with descriptions
- [ ] Apply extractPhotos with --extract-scheme by-marker-description
- [ ] Creates nested map/marker directories using descriptions
- [ ] All photos in correct marker directories
- [ ] Folder names sanitized for filesystem (no invalid chars)

**Scenario 8: Extract Photos (by-marker-number)**
- [ ] Export with 10 markers (unsorted createdDate)
- [ ] Apply extractPhotos with --extract-scheme by-marker-number
- [ ] Calculates marker numbers (sort by createdDate)
- [ ] Creates folders with chronological numbers (marker-001, marker-002, etc.)
- [ ] Correct photos in correct numbered folders

**Scenario 9: Extract and Remove Photo Data**
- [ ] Export with 50 embedded photos (large file)
- [ ] Chain extractPhotos → removePhotoData
- [ ] Photos extracted to JPEG files successfully
- [ ] Export file modified to remove `imageData` from photo objects
- [ ] Photo objects remain with metadata
- [ ] Export file size significantly reduced
- [ ] Both export and JPEG files validated

**Scenario 10: Photo Filename Filtering**
- [ ] Export with 100 embedded photos
- [ ] Create filter file with 10 specific filenames
- [ ] Use --photo-filter flag
- [ ] Only 10 photos extracted (matching filter)
- [ ] Other 90 photos remain in export
- [ ] Extraction report lists filtered photos

**Scenario 11: Photo-Finder Integration**
- [ ] Run photo-finder to generate missing.txt (5 missing photos)
- [ ] Use missing.txt as --photo-filter
- [ ] Extract only those 5 photos from export
- [ ] Recovered photos match original filenames
- [ ] Recovered photos have correct hashes

### Manual Testing (Browser UI)

**Test 1: Configuration Integration**

**How to Test:**
1. Open `tools/export-transformer-ui/` in browser
2. Verify configuration notice appears if not configured
3. Click "Configure Paths" link
4. Set `exportsDir` and `photosDir` in config UI
5. Return to export-transformer UI
6. Verify paths pre-populated in input fields

**Expected Results:**
- ✅ Configuration values loaded correctly
- ✅ Paths pre-populated in form fields
- ✅ Link to config page works

**Test 2: Export File Loading**

**How to Test:**
1. Select single export file
2. Verify export summary displays (maps count, markers count, photos count)
3. Select multiple exports with pattern (*.json)
4. Verify file list preview shows

**Expected Results:**
- ✅ Export parsed successfully
- ✅ Summary displays correct counts
- ✅ Pattern matching shows file list

**Test 3: Transformation Configuration**

**How to Test:**
1. Check "Extract Photos" transformation
2. Configure extraction options:
   - Output directory (use pre-filled value)
   - Scheme: by-marker-number
   - Marker naming: number
3. Verify configuration panel updates

**Expected Results:**
- ✅ All options available in UI
- ✅ Configuration panel shows/hides correctly
- ✅ Default values pre-populated

**Test 4: Photo-Finder Report Import**

**How to Test:**
1. Create test photo-finder report (missing.txt with 5 filenames)
2. Click "Import Photo-Finder Report" button
3. Select missing.txt file
4. Verify filename filter populated with 5 filenames

**Expected Results:**
- ✅ Report file parsed correctly
- ✅ Filename filter populated
- ✅ One filename per line in text area

**Test 5: Command Builder**

**How to Test:**
1. Configure transformation (Extract Photos)
2. Set all options (scheme, marker naming, photo filter)
3. Click "Generate Command"
4. Verify command appears in code block
5. Click "Copy to Clipboard"
6. Paste in text editor to verify

**Expected Results:**
- ✅ Command syntax correct
- ✅ All flags included
- ✅ Paths properly escaped/quoted
- ✅ Copy-to-clipboard works
- ✅ Example: `node export-transformer.js --export ./my-site.json --transform extractPhotos --extract-photos ./photos --extract-scheme by-marker-number --marker-naming number --photo-filter missing.txt`

**Test 6: Preview Panel**

**How to Test:**
1. Load export with 3 maps, 50 photos
2. Configure "Extract Photos" with filter (10 filenames)
3. Click "Preview"
4. Verify preview shows:
   - 3 maps affected
   - 10 photos to be extracted (filtered list)
   - Output directory structure

**Expected Results:**
- ✅ Preview shows accurate summary
- ✅ Photo count matches filter
- ✅ Directory structure preview correct

**Test 7: Split Markers Configuration**

**How to Test:**
1. Load export with markers having multiple photos
2. Check "Split Markers" transformation
3. Enter description template: "{original} ({number})"
4. Click "Preview"
5. Verify preview shows:
   - Number of markers to be split
   - Example descriptions for split markers
6. Generate command

**Expected Results:**
- ✅ Preview shows accurate split count
- ✅ Example descriptions rendered correctly
- ✅ Command includes split flags
- ✅ Example: `--transform splitMarkers --split-description-template "{original} ({number})"`

**Test 7a: Multiple Transformations Chain**

**How to Test:**
1. Check "Split Markers"
2. Check "Extract Photos"
3. Configure extraction with "extract-and-remove"
4. Verify both transformations listed in order
5. Generate command

**Expected Results:**
- ✅ Multiple transformations configurable
- ✅ Order preserved
- ✅ Command includes all transformations
- ✅ Example: `--transform splitMarkers --transform extractPhotos --extract-photos ./photos --extract-and-remove`

**Test 8: Responsive Layout**

**How to Test:**
1. Test at 1280px width (minimum supported)
2. Test at 1920px width (maximum tested)
3. Verify all panels visible and accessible

**Expected Results:**
- ✅ All UI elements accessible at all widths
- ✅ No horizontal scrolling
- ✅ Clear visual hierarchy maintained

### Performance Tests
- [ ] Transform single export: <100ms
- [ ] Batch 100 exports: <10 seconds
- [ ] Extract 1000 photos: <30 seconds
- [ ] Extract with filter (1000 photos, 50 in filter): <5 seconds
- [ ] Calculate marker numbers (1000 markers): <10ms
- [ ] Split markers (100 markers with avg 3 photos each): <1 second
- [ ] Memory usage <500MB for 10k photos

---

## Implementation Notes

### Marker Number Calculation

**Important:** Marker numbers are NOT stored in the SnapSpot export file. They are calculated on-the-fly.

**Algorithm:**
```javascript
function calculateMarkerNumbers(markers) {
  // Sort markers by createdDate (ascending) - earliest first
  const sorted = markers.slice().sort((a, b) => 
    new Date(a.createdDate) - new Date(b.createdDate)
  )
  
  // Assign sequential numbers starting from 1
  const markerNumbers = new Map()
  sorted.forEach((marker, index) => {
    markerNumbers.set(marker.id, index + 1)
  })
  
  return markerNumbers
}
```

**Usage in folder naming:**
- When `--marker-naming number` specified
- When `--extract-scheme by-marker-number` specified
- Folder names: `marker-001`, `marker-002`, etc. (zero-padded)

### Photo Extraction Process

### Photo Extraction Process

```javascript
async function extractPhotosToFiles(exportData, outputDir, options) {
  const { 
    scheme = 'by-map', 
    markerNaming = 'description',
    photoFilter = null  // Optional: array of filenames to extract
  } = options
  
  // Calculate marker numbers (chronological by createdDate)
  const markerNumbers = calculateMarkerNumbers(exportData.markers)
  
  for (const map of exportData.maps) {
    for (const marker of map.markers) {
      // Get marker identifier (number or description)
      const markerNum = markerNumbers.get(marker.id)
      const markerFolder = markerNaming === 'number' 
        ? `marker-${String(markerNum).padStart(3, '0')}`
        : sanitizeFilename(marker.description)
      
      for (const photo of marker.photos) {
        // Apply filename filter if provided
        if (photoFilter && !photoFilter.includes(photo.filename)) {
          continue  // Skip photos not in filter
        }
        
        // Get base64 data
        const base64Data = photo.imageData
        
        // Convert to blob using lib/snapspot-image/converter.js
        const blob = await base64ToBlob(base64Data)
        
        // Determine output path based on scheme
        const outputPath = getOutputPath(scheme, map, markerFolder, photo)
        
        // Write JPEG file
        await fs.writeFile(outputPath, Buffer.from(await blob.arrayBuffer()))
        
        // Verify with hash
        const hash = await generateImageHash(blob)
        if (hash !== photo.imageHash) {
          console.warn(`Hash mismatch for ${photo.filename}`)
        }
      }
    }
  }
}

function sanitizeFilename(str) {
  // Replace invalid filename characters with dashes
  return str.replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '-')
}
```

### Photo Filter Format

**Text file (one filename per line):**
```
photo-001.jpg
photo-002.jpg
IMG_1234.jpg
DSC_5678.jpg
```

**Generated by photo-finder:**
```bash
# photo-finder creates missing.txt
node photo-finder.js --export site.json --photos-dir ./photos --report missing.txt

# Use missing.txt to extract only missing photos
node export-transformer.js --export site.json --transform extractPhotos \
  --extract-photos ./recovered --photo-filter missing.txt
```

### Directory Schemes

**by-map:**
```
output/
  Floor-1/
    marker-001-photo-001.jpg
    marker-001-photo-002.jpg
    marker-002-photo-001.jpg
  Floor-2/
    marker-003-photo-001.jpg
```

**by-marker-description (using marker description):**
```
output/
  Floor-1/
    Front-Entrance/
      photo-001.jpg
      photo-002.jpg
    Back-Exit/
      photo-001.jpg
  Floor-2/
    Stairwell/
      photo-001.jpg
```

**by-marker-number (using chronological marker numbers):**
```
output/
  Floor-1/
    marker-001/
      photo-001.jpg
      photo-002.jpg
    marker-002/
      photo-001.jpg
  Floor-2/
    marker-003/
      photo-001.jpg
```

**flat:**
```
output/
  photo-001.jpg
  photo-002.jpg
  photo-003.jpg
  (uses hash suffix for collisions: photo-001-a1b2c3.jpg)
```

### Marker Naming Strategy

**Description-based naming:**
- Pro: Human-readable folder names
- Con: Descriptions may contain invalid filesystem characters
- Solution: Sanitize (replace `<>:"/\|?*` with `-`)
- Example: `"Front Entrance (Main)"` → `Front-Entrance-Main`

**Number-based naming:**
- Pro: Consistent, filesystem-safe
- Con: Less human-readable
- Solution: Zero-padded sequential numbers
- Example: `marker-001`, `marker-002`, etc.
- Numbers calculated by sorting markers by `createdDate` (ascending)

### Marker Splitting Process

**Use Case:** In the field, it's quicker to place one marker and add multiple photos. Later, split these markers so each has one photo with a meaningful description.

**Algorithm:**
```javascript
function splitMarkersWithMultiplePhotos(exportData, options) {
  const { descriptionTemplate = '{original} - Photo {number}' } = options
  const newMarkers = []
  const splitReport = []
  
  for (const map of exportData.maps) {
    const markersToProcess = map.markers.filter(m => m.photos.length > 1)
    
    for (const marker of markersToProcess) {
      // Keep first photo in original marker
      const firstPhoto = marker.photos[0]
      const remainingPhotos = marker.photos.slice(1)
      
      // Create new markers for remaining photos
      remainingPhotos.forEach((photo, index) => {
        const newMarker = {
          id: crypto.randomUUID(),
          mapId: marker.mapId,
          x: marker.x,  // Same position as original
          y: marker.y,
          description: descriptionTemplate
            .replace('{original}', marker.description)
            .replace('{number}', index + 2),  // Photo 2, 3, 4, etc.
          photoIds: [photo.id],
          photos: [photo],
          createdDate: new Date(
            new Date(marker.createdDate).getTime() + (index + 1) * 1000
          ).toISOString(),  // Increment by 1 second to maintain order
          number: null  // Calculated on display
        }
        newMarkers.push(newMarker)
      })
      
      // Update original marker to have only first photo
      marker.photos = [firstPhoto]
      marker.photoIds = [firstPhoto.id]
      
      splitReport.push({
        originalId: marker.id,
        originalDescription: marker.description,
        photoCount: remainingPhotos.length + 1,
        newMarkersCreated: remainingPhotos.length
      })
    }
    
    // Add new markers to map
    map.markers.push(...newMarkers)
  }
  
  return { exportData, splitReport }
}
```

**Example:**
- **Before:** 1 marker "Equipment Room" with 3 photos
- **After:** 
  - Marker 1: "Equipment Room - Photo 1" (original position)
  - Marker 2: "Equipment Room - Photo 2" (same position)
  - Marker 3: "Equipment Room - Photo 3" (same position)

**Benefits:**
- Better organization for field documentation
- Each photo can have specific description later in SnapSpot app
- Easier to reference individual photos
- More informative when viewing markers on map

### Stacked Markers UI Considerations (SnapSpot PWA)

**Challenge:** Split markers at identical coordinates appear as one marker in SnapSpot app.

**Context:**
- Marker splitting creates new markers at same `x,y` position as original
- SnapSpot PWA needs UI to access individual stacked markers
- User should be able to select which marker to open

**UI Implementation Options:**

**Option A: Circular Spread (Recommended for Phase 2)**
- Click stack → Markers spread out in circle → Click individual marker → Collapse back
- **Pros:** Visual, intuitive, maintains spatial context, looks polished
- **Cons:** More complex (animation, collision detection, spread radius calculation)
- **Implementation:** Medium-High complexity

**Option B: Modal List (Recommended for Phase 1)**
- Click stack → Modal appears with list of markers → Click marker in list → Modal closes
- **Pros:** Simple implementation, can show photo thumbnails and descriptions
- **Cons:** Takes user out of map context, extra click to close
- **Implementation:** Low complexity
- **UI:** Similar to photo gallery selection (familiar pattern)

**Option C: Popup Menu (Alternative)**
- Click stack → Popup menu at marker with mini cards → Click card → Opens marker
- **Pros:** Simpler than circular spread, keeps spatial context, shows previews
- **Cons:** Boundary detection needed, limited space for many markers
- **Implementation:** Low-Medium complexity

**Recommended Approach:**
1. **Phase 1:** Implement Modal List (quick, gets functionality working)
2. **Phase 2:** Add Circular Spread as UX enhancement (better user experience)

**Note:** SnapSpot PWA modifications are outside Phase 7C scope. Document here for future implementation.

### Photo Data Removal vs Photo Object Removal

**Important distinction:**

**Remove Photo Data (`removePhotoData`):**
```javascript
// BEFORE
{
  "id": "photo-123",
  "filename": "IMG_001.jpg",
  "imageData": "data:image/jpeg;base64,/9j/4AAQ...", // ~500KB
  "imageHash": "a1b2c3d4...",
  "markerId": "marker-456",
  "createdDate": "2026-02-03T10:30:00Z"
}

// AFTER removePhotoData
{
  "id": "photo-123",
  "filename": "IMG_001.jpg",
  // imageData removed
  "imageHash": "a1b2c3d4...",
  "markerId": "marker-456",
  "createdDate": "2026-02-03T10:30:00Z"
}
```

**Use Cases:**
- Export for sharing (smaller file size)
- Local serving workflow:
  1. Extract photos to `./photos` directory
  2. Remove imageData from export
  3. SnapSpot PWA serves photos from local directory using `filename`
  4. High-quality photos + lightweight export
- Hybrid workflow: Export for backup, local photos for viewing

**Implementation:**
```javascript
function removePhotoData(exportData) {
  // SnapSpot export contains exactly one map
  const map = exportData.maps[0]
  
  for (const marker of map.markers) {
    for (const photo of marker.photos) {
      // Remove only imageData property
      delete photo.imageData
      // Keep all other properties: id, filename, imageHash, markerId, createdDate
    }
  }
  
  return exportData
}
```

---

## Future Considerations

### Format Transformation (Phase 7F or later)

The Export Transformer architecture is designed to support **format transformation** to other applications using mapping files.

**Concept:**
```json
{
  "targetFormat": "OtherApp v2.0",
  "propertyMapping": {
    "map.name": "floor.title",
    "map.imageData": "floor.blueprint",
    "marker.x": "point.coordinates.x",
    "marker.y": "point.coordinates.y",
    "marker.description": "point.label",
    "photo.imageData": "attachment.data"
  },
  "transformations": {
    "coordinates": "invert_y_axis",
    "dates": "unix_timestamp"
  }
}
```

**Use Cases:**
- Export SnapSpot data to CAD applications
- Import into facility management software
- Generate reports for other documentation systems
- Archive in standardized formats

**Implementation:**
- CLI flag: `--format-mapping <file.json>`
- Browser UI: Format template selector
- Reuse existing parsing/writing infrastructure
- Add property transformation layer

**Not in Phase 7C scope** - document for future reference.

---

## Next Steps

After completing Phase 7C:
- Proceed to [Phase 7D: Organizer Tool](PHASE_7D_ORGANIZER.md)
- Extract transformation can be used before Organizer if needed

# Phase 7C: Export Transformer — Universal Selection & Action Tool

**Status:** ⏳ PLANNED  
**Parent Phase:** Phase 7 - Node.js CLI Utilities  
**Duration:** 7 days (estimated)  
**Dependencies:** Phase 7A complete (CLI Foundation established), Phase 7B complete (Photo Finder for filter integration)  
**Goal:** Build a universal, extensible tool for selecting markers/photos in SnapSpot exports and applying actions to the selection — both as a rich browser UI and a scriptable CLI

---

## Design Philosophy

Instead of pre-defined "transform everything" operations, Export Transformer follows a **selection → action** model:

1. **Load** an export and visualize it (map + tree)
2. **Select** markers/photos using filters, map clicks, or manual checkboxes
3. **Act** on the selection (delete, remove photo data, extract photos, rename)

This mirrors how users actually work: *"Show me the markers Bob placed that I don't have photos for, and let me remove them."*

The architecture is **plugin-based** — adding a new filter or action is ~15–20 lines of code without touching the UI.

---

## What's NOT in scope

| Dropped from original design | Reason |
|---|---|
| Marker splitting | Creates stacked markers that SnapSpot PWA can't yet navigate. Revisit when PWA has stacked marker UI. |
| Separate CLI "command builder" UI | The browser UI **is** the tool. CLI exists for scripting/automation, not as a secondary interface. |
| Placeholder transforms (renameMap, removeMap, setCustomMetadata) | These become natural actions in the new model — no need for placeholders. |
| Format transformation to other apps | Future phase (7F+). Architecture supports it via plugin system. |

---

## UI Design: Three-Panel Layout

```
+==============================================================+
|  Export Transformer                            [Config] [?]  |
+==============================================================+
|  TOOLBAR: [Filters v] [Actions v]   12 markers . 5 selected  |
+------------+---------------------+----------------------------+
|  TREE      |                     |  DETAILS                   |
|            |                     |                            |
| [?] Export |    MAP VIEW         |  * "Front Entrance"        |
|  [?] Map   |    (pan/zoom)       |  ---------------------     |
|   [?] * A  |                     |  ID: a1b2c3d4-...          |
|   [x] * B  |    . = normal       |  Position: (345, 256)      |
|   [?] * C! |    (o) = selected   |  Created: 2026-05-12       |
|    [?] img |    o = filtered     |  Photos: 3                 |
|    [?] imgX|    (o!) = missing ! |                            |
|   [?] * D  |                     |  Photo status:             |
|   [x] * E  |    Click = select   |  V IMG_2401.jpg - 2.4 MB   |
|            |    Shift+click =    |  V IMG_2402.jpg - 1.8 MB   |
| Collapse   |      multi-select   |  X IMG_2403.jpg - missing  |
| all markers|    Hover = tooltip   |                            |
| by default |                     |                            |
+------------+---------------------+----------------------------+
```

### Panel 1: Tree (left column)

A collapsible hierarchical view of the export structure. **Markers are collapsed by default** — users expand them only when they need photo-level selection.

**What's shown at each level:**

| Level | Visible info | Always shown |
|---|---|---|
| **Export root** | Export name + date | Yes |
| **Map** | Map name, marker count, photo count | Yes |
| **Marker** | Description, photo count, date, status badge | Yes |
| **Photo** | Filename, file size, found/missing status | Only when marker expanded |

**Status badges on markers:**
- `!` — Has missing photos (from photo-finder integration)
- `clip` — Has photos but `imageData` was stripped (metadata-only)
- *(no badge)* — All photos present and embedded

**Status badges on photos:**
- `V` — Photo found on disk (photo-finder confirmed)
- `X` — Photo missing (not found by photo-finder)
- *(no badge)* — Status unknown (no photo-finder data loaded)

**Checkbox behavior:**
- Check a marker → selects the marker (not individual photos)
- Check the map → selects all markers
- Check the export → selects everything
- Photo-level checkboxes appear only when a marker is expanded, for granular photo actions

### Panel 2: Map (center)

Reuses `CanvasRenderer` from `tools/map-migrator/` (already handles pan/zoom, image rendering, marker drawing). Enhanced with:

- **Marker click** → select that marker in the tree
- **Shift+click** → add/remove from multi-selection
- **Hover** → tooltip with description + photo count + missing status
- **Visual states:**
  - Default: semi-transparent dot (primary color)
  - Filter match: brighter, slightly larger
  - Selected: blue filled circle with white border
  - Missing photos: red ring around the dot
  - Selected + missing: blue fill + red ring

### Panel 3: Details (right column)

Shows **technical properties** for the currently focused item. This is where IDs, coordinates, hashes, and other raw data live — keeping the tree clean.

| When selecting... | Details panel shows |
|---|---|
| **A marker** | ID, X/Y coordinates, createdDate (ISO), photo count, total photo size, photo status list |
| **A photo** | ID, filename, file size, imageHash, markerId, createdDate, file path on disk (if found) |
| **Nothing** | Export summary: version, sourceApp, timestamp, total markers, total photos, total size |

---

## Toolbar

### Filter Bar (collapsible)

```
+==============================================================+
| FILTERS  [Date Range v] [Text Search v] [Photo Status v] [+] |
+==============================================================+
| Date:  [2026-05-01]  to  [2026-05-31]    [Apply] [Clear]     |
| Text:  [Front              ] in [description v]               |
| Photo: [x] Missing  [ ] No photos  [ ] Has embedded data      |
| Source: [Run Photo-Finder...]  [Load Manifest...]  manifest.json |
|                                                              |
| > 12 of 45 markers match  [Select Matching] [+ Add to Sel.]  |
+==============================================================+
```

Active filters show a badge count. The `[+]` button is reserved for future custom filter plugins.

### Action Bar

```
+==============================================================+
| ACTIONS  [Delete Selected] [Remove Photo Data] [Extract...] [v]|
|          5 markers selected  .  12 photos affected            |
|          [x] Create backup before modifying                    |
+==============================================================+
```

Actions are disabled when no selection exists. Destructive actions (Delete) show a confirmation dialog with a summary of what will be removed.

---

## Plugin Architecture

Both filters and actions are defined as simple objects in a registry. Adding a new one requires no changes to the tree, map, or details panel.

### Filter Plugin Interface

```javascript
// Registry entry — add to filters.js
{
  id: 'dateRange',
  label: 'Date Range',
  icon: 'calendar',
  config: {
    from: { type: 'date', label: 'From', default: null },
    to:   { type: 'date', label: 'To',   default: null }
  },
  // Returns array of matching marker IDs
  apply(exportData, config) {
    return exportData.markers
      .filter(m => {
        const d = new Date(m.createdDate)
        if (config.from && d < new Date(config.from)) return false
        if (config.to   && d > new Date(config.to))   return false
        return true
      })
      .map(m => m.id)
  }
}
```

### Action Plugin Interface

```javascript
// Registry entry — add to actions.js
{
  id: 'deleteMarkers',
  label: 'Delete Selected Markers',
  icon: 'trash',
  requiresSelection: true,
  destructive: true,    // Shows confirmation dialog
  confirmMessage: (count) => `Delete ${count} markers and their photos?`,
  async execute(exportData, selection, options) {
    const ids = selection.selectedMarkerIds
    exportData.markers = exportData.markers.filter(m => !ids.has(m.id))
    exportData.photos  = exportData.photos.filter(p => !ids.has(p.markerId))
    return exportData
  }
}
```

### Built-in Filters (Phase 7C)

| Filter | Description |
|---|---|
| `dateRange` | Markers created within a date range |
| `textSearch` | Markers whose description/name contains a search string |
| `missingPhotos` | Markers with photos not found by photo-finder (uses internal manifest or loaded manifest file) |
| `noPhotos` | Markers with zero photos |
| `hasEmbeddedData` | Markers whose photos still have `imageData` (not yet stripped) |
| `noEmbeddedData` | Markers whose photos have had `imageData` removed (metadata-only) |

### Built-in Actions (Phase 7C)

| Action | Scope | Description |
|---|---|---|
| `deleteMarkers` | Selected markers | Remove markers and their photos from the export |
| `removePhotoData` | Selected markers' photos | Strip `imageData` property, keep metadata |
| `extractPhotos` | Selected markers' photos | Extract Base64 photos to JPEG files on disk |
| `renameMarkers` | Selected markers | Apply a rename template (e.g., prefix, suffix, find-replace) |

---

## Deliverables

### Browser UI (`tools/export-transformer/`)

- [ ] `tools/export-transformer/index.html` — Three-panel layout with map canvas, tree container, details panel
- [ ] `tools/export-transformer/ui-controller.js` — Main controller: file loading, selection state, panel coordination
- [ ] `tools/export-transformer/tree-view.js` — Recursive tree component (export -> map -> markers -> photos)
- [ ] `tools/export-transformer/map-view.js` — Map rendering with marker selection (wraps CanvasRenderer)
- [ ] `tools/export-transformer/details-panel.js` — Dynamic property display for selected items
- [ ] `tools/export-transformer/filters.js` — Filter plugin registry + UI generation
- [ ] `tools/export-transformer/actions.js` — Action plugin registry + execution engine
- [ ] `tools/export-transformer/selection.js` — Central selection state (pub/sub, set-based)
- [ ] `tools/export-transformer/photo-finder-integration.js` — Invoke photo-finder programmatically and parse internal manifest format
- [ ] `tools/export-transformer/styles.css` — Layout, tree styling, map container, details panel

### CLI Tool (`cli/tools/export-transformer/`)

- [ ] `cli/tools/export-transformer/export-transformer.js` — CLI entry point with filter/action flags
- [ ] `cli/tools/export-transformer/README.md` — CLI usage and examples

### Shared Module

- [ ] `core/export-transformer/selection-engine.js` — Framework-agnostic selection + filter + action engine (used by both browser UI and CLI)

---

## Tasks

### 7C.1 Core Selection Engine (`core/export-transformer/`)

This is the framework-agnostic engine shared by both browser UI and CLI. No DOM, no Node.js specifics.

- [ ] **`selection-engine.js` — SelectionState class:**
  - [ ] `selectedMarkerIds` — `Set<string>`, single source of truth
  - [ ] `selectedPhotoIds` — `Set<string>`, for granular photo actions
  - [ ] `subscribe(callback)` — Pub/sub for UI updates
  - [ ] `select(markerId)` / `deselect(markerId)` / `toggle(markerId)`
  - [ ] `selectAll(exportData)` / `clearAll()`
  - [ ] `selectByFilter(filter, config, exportData)` — Replace selection with filter results
  - [ ] `addByFilter(filter, config, exportData)` — Add filter results to existing selection
  - [ ] `removeByFilter(filter, config, exportData)` — Remove filter results from selection
  - [ ] `getSelectedMarkers(exportData)` — Returns full marker objects for selected IDs
  - [ ] `getSelectedPhotos(exportData)` — Returns full photo objects for selected IDs
  - [ ] `getSelectionStats(exportData)` — Counts, sizes, status summary

- [ ] **`selection-engine.js` — Filter registry:**
  - [ ] `registerFilter(filterPlugin)` — Add a filter to the registry
  - [ ] `getFilter(id)` — Retrieve a filter by ID
  - [ ] `listFilters()` — All registered filters with metadata
  - [ ] `applyFilter(id, config, exportData)` — Run a filter, return matching marker IDs
  - [ ] Filter plugins are plain objects: `{ id, label, icon, config, apply() }`

- [ ] **`selection-engine.js` — Action registry:**
  - [ ] `registerAction(actionPlugin)` — Add an action to the registry
  - [ ] `getAction(id)` — Retrieve an action by ID
  - [ ] `listActions()` — All registered actions with metadata
  - [ ] `executeAction(id, exportData, selection, options)` — Run an action, return modified export + report
  - [ ] Action plugins are plain objects: `{ id, label, icon, requiresSelection, destructive, execute() }`

- [ ] **Built-in filter implementations:**
  - [ ] `dateRange` — Filter markers by `createdDate` range
  - [ ] `textSearch` — Filter markers by substring in `description`
  - [ ] `missingPhotos` — Filter markers where photo-finder found missing photos
  - [ ] `noPhotos` — Filter markers with zero photos
  - [ ] `hasEmbeddedData` — Filter markers whose photos still have `imageData`
  - [ ] `noEmbeddedData` — Filter markers whose photos had `imageData` removed

- [ ] **Built-in action implementations:**
  - [ ] `deleteMarkers` — Remove selected markers and their photos from export
  - [ ] `removePhotoData` — Strip `imageData` from selected markers' photos (keep photo objects)
  - [ ] `extractPhotos` — Extract selected markers' photos to JPEG files on disk
  - [ ] `renameMarkers` — Apply find-replace or template to selected markers' descriptions

- [ ] **`missingPhotos` filter — photo-finder integration:**
  - [ ] Two data sources for the filter:
    - [ ] **Background invocation:** Call `findPhotosForExport()` from Photo Finder CLI programmatically, use the returned internal manifest (same API Organizer uses)
    - [ ] **Load existing manifest:** Accept a previously-saved Photo Finder manifest JSON file
  - [ ] Internal manifest format (from Photo Finder's `generateInternalManifest()`):
    - [ ] Per-photo record: `{ filename, markerId, markerNumber, mapName, foundPath, status }`
    - [ ] Status values: `'found'`, `'missing'`, `'duplicate'`
  - [ ] Build lookup: `filename -> { found, path, markerId }` for the filter to determine which markers have missing photos
  - [ ] When no manifest is loaded and no background invocation is run, the `missingPhotos` filter returns no results (unknown status)

### 7C.2 Browser UI — Layout & Shell

- [ ] **`index.html`:**
  - [ ] Three-column CSS grid layout (tree | map | details)
  - [ ] Collapsible filter bar at top
  - [ ] Action toolbar below filter bar
  - [ ] Desktop warning overlay (1280px minimum, per project convention)
  - [ ] File drop zone for export loading (reuse pattern from map-migrator)
  - [ ] File drop zone for photo-finder report loading
  - [ ] Canvas element for map view
  - [ ] Tree container div
  - [ ] Details container div
  - [ ] Modal for confirmation dialogs (delete, etc.)
  - [ ] Link to configuration page (`/tools/config/`)

### 7C.3 Browser UI — Tree View

- [ ] **`tree-view.js` — TreeView class:**
  - [ ] Render export -> map -> markers (collapsed) -> photos (hidden until expanded)
  - [ ] Checkbox at each level with tri-state (none / some / all selected)
  - [ ] Click marker in tree -> select it, scroll map to marker, update details
  - [ ] Click photo in tree -> select it, update details
  - [ ] Expand/collapse markers individually
  - [ ] "Expand all" / "Collapse all" buttons
  - [ ] Visual indicators: status badges, selected state, filter match highlight
  - [ ] Show marker count, photo count at map and export level
  - [ ] Virtual scrolling for large exports (500+ markers)

### 7C.4 Browser UI — Map View

- [ ] **`map-view.js` — MapView class (wraps CanvasRenderer):**
  - [ ] Load map image via `renderer.loadImage()`
  - [ ] Enable pan/zoom via `renderer.enablePanZoom()`
  - [ ] Draw markers as clickable dots with visual states:
    - [ ] Normal: semi-transparent primary color, 7px radius
    - [ ] Filter match: brighter, 9px radius
    - [ ] Selected: blue fill (#2563eb) with white border, 9px radius
    - [ ] Missing photos: red ring (#dc2626), 2px border
    - [ ] Selected + missing: blue fill + red ring
  - [ ] Click marker -> select (sync with tree + details)
  - [ ] Shift+click marker -> toggle in multi-selection
  - [ ] Hover marker -> tooltip: description, photo count, status
  - [ ] `onRedraw` callback for maintaining overlays during pan/zoom
  - [ ] Coordinate transformation (screen <-> world) via `renderer.screenToWorld()`

### 7C.5 Browser UI — Details Panel

- [ ] **`details-panel.js` — DetailsPanel class:**
  - [ ] When marker selected: show ID, x/y, createdDate, photo count, total photo size, photo status list
  - [ ] When photo selected: show ID, filename, fileSize, imageHash, markerId, createdDate, disk path (if found)
  - [ ] When nothing selected: show export summary (version, timestamp, counts, total size)
  - [ ] Copy-to-clipboard buttons for IDs and paths
  - [ ] Photo status list with found/missing indicators and file sizes

### 7C.6 Browser UI — Filter Bar

- [ ] Collapsible filter bar with active filter count badge
- [ ] Each filter renders its own config UI based on the plugin's `config` schema
- [ ] Date range: two date inputs
- [ ] Text search: text input + field selector dropdown
- [ ] Photo status: checkboxes for missing / no photos / has embedded data
- [ ] Photo-finder integration in filter bar:
    - [ ] "Run Photo-Finder" button — invokes Photo Finder CLI programmatically in the background
    - [ ] Shows progress while running (photo count, found/missing)
    - [ ] "Load Manifest" button — accepts a previously-saved Photo Finder manifest JSON file via drag-drop or file picker
    - [ ] Shows loaded manifest filename and summary (e.g., "manifest.json — 95 found, 5 missing")
    - [ ] `missingPhotos` filter becomes active once manifest data is available
- [ ] "Select Matching" button — replaces selection with filtered markers
- [ ] "+ Add to Selection" button — adds filtered markers to current selection
- [ ] Clear all filters button
- [ ] Results count: "12 of 45 markers match"

### 7C.7 Browser UI — Action Bar

- [ ] Action buttons rendered from action registry
- [ ] Disabled state when no selection exists
- [ ] Selection summary: "5 markers selected . 12 photos affected"
- [ ] Backup checkbox (create .bak before modifying)
- [ ] Confirmation dialog for destructive actions (shows what will be removed)
- [ ] Success/error feedback after action execution
- [ ] Undo support (restore from backup)

### 7C.8 Browser UI — Integration & Polish

- [ ] **Configuration integration:**
  - [ ] Load paths from `config-manager.js` on page load
  - [ ] Pre-populate export directory for file picker
  - [ ] Pre-populate photo extraction output directory
  - [ ] Show "Configure paths" notice if incomplete
  - [ ] Link to config page

- [ ] **Photo-finder integration:**
  - [ ] "Run Photo-Finder" triggers background invocation of Photo Finder CLI via `findPhotosForExport()`
  - [ ] Photo search directory pre-populated from config (`paths.photosDir`)
  - [ ] Progress feedback during search (e.g., "Scanning 1,247 files... 45/50 photos found")
  - [ ] On completion: internal manifest populates the `missingPhotos` filter data
  - [ ] "Load Manifest" accepts drag-drop or file picker for an existing manifest JSON
  - [ ] Manifest summary shown: total photos, found, missing, duplicate counts
  - [ ] Visual indicators update on map (red rings) and tree (warning badges) immediately

- [ ] **Export save workflow:**
  - [ ] "Save Export" button writes modified export via `lib/snapspot-data/writer.js`
  - [ ] Auto-creates `.bak` backup before overwriting
  - [ ] Download modified export as new file (browser download)
  - [ ] Validation before save

- [ ] **Styling (`styles.css`):**
  - [ ] Follow `shared/styles/variables.css` design tokens
  - [ ] Follow `shared/styles/common.css` component patterns
  - [ ] Three-column grid: `250px 1fr 300px` at 1280px+
  - [ ] Tree indentation with guide lines
  - [ ] Map container with proper aspect ratio
  - [ ] Details panel with property grid layout
  - [ ] Filter bar with horizontal form layout
  - [ ] Responsive collapse to stacked layout below 1280px (with warning)
  - [ ] Transition animations for selection state changes

### 7C.9 CLI Tool

- [ ] **`export-transformer.js`:**
  - [ ] Import `core/export-transformer/selection-engine.js`
  - [ ] Import `cli/shared/export-loader.js`, `export-writer.js`
  - [ ] Import `cli/shared/report-generator.js`

- [ ] **CLI flags:**
  - [ ] `--export <path>` — Export file to transform
  - [ ] `--filter <id> <params...>` — Apply a filter (repeatable, filters are AND-ed)
    - [ ] `--filter dateRange --from 2026-01-01 --to 2026-06-01`
    - [ ] `--filter textSearch --query "Front" --field description`
    - [ ] `--filter missingPhotos --search <dir>` — Run Photo Finder in background, search directory for photos
    - [ ] `--filter missingPhotos --manifest <path>` — Use existing Photo Finder manifest JSON file
    - [ ] `--filter noPhotos`
    - [ ] `--filter hasEmbeddedData`
  - [ ] `--action <id> <params...>` — Apply an action to filtered selection (repeatable, sequential)
    - [ ] `--action deleteMarkers`
    - [ ] `--action removePhotoData`
    - [ ] `--action extractPhotos --output ./photos --scheme by-map`
    - [ ] `--action renameMarkers --find "Old" --replace "New"`
  - [ ] `--select-all` — Select all markers (no filter needed)
  - [ ] `--backup` — Create .bak before modifying
  - [ ] `--dry-run` — Preview only, no modifications
  - [ ] `--output <path>` — Save modified export to different location
  - [ ] `--report <path>` — Save transformation report

- [ ] **CLI behavior:**
  - [ ] If no `--select-all` and no `--filter`, error: "No selection criteria specified"
  - [ ] Filters combine with AND logic
  - [ ] Actions execute in order
  - [ ] Dry-run shows what would happen
  - [ ] Report shows before/after counts

### 7C.10 Documentation & Testing

- [ ] **`README.md` (CLI tool):**
  - [ ] Tool overview and design philosophy
  - [ ] CLI mode examples for common tasks
  - [ ] All filter references with examples
  - [ ] All action references with examples
  - [ ] Photo-finder integration guide
  - [ ] Safety features (backups, dry-run)
  - [ ] Troubleshooting section

- [ ] **Unit tests (`core/export-transformer/__tests__/`):**
  - [ ] Selection state operations (select, deselect, toggle, selectAll, clearAll)
  - [ ] Filter registration and application (all 6 built-in filters)
  - [ ] Action registration and execution (all 4 built-in actions)
  - [ ] Filter AND combination logic
  - [ ] Action chaining (sequential execution)
  - [ ] Photo-finder integration (background invocation returns correct manifest)
  - [ ] Photo-finder integration (loading existing manifest JSON)
  - [ ] Selection stats calculation
  - [ ] Plugin registration (custom filter/action)

- [ ] **Integration tests:**
  - [ ] Load real export, apply dateRange filter, verify correct markers selected
  - [ ] Load real export, apply missingPhotos filter with report, verify indicators
  - [ ] Chain: filter -> deleteMarkers -> verify export valid after save

- [ ] **Manual testing (Browser UI):**
  - [ ] Export load and tree rendering
  - [ ] Map marker rendering with all visual states
  - [ ] Click/Shift+click selection sync (tree <-> map <-> details)
  - [ ] Filter application and visual feedback
  - [ ] Photo-finder report loading
  - [ ] Action execution with confirmation
  - [ ] Export save and backup creation
  - [ ] Configuration pre-population
  - [ ] Responsive layout at 1280px and 1920px

---

## Acceptance Criteria

### Core Engine
- [ ] Selection state is the single source of truth; tree, map, and details all reflect it
- [ ] All 6 built-in filters work correctly
- [ ] All 4 built-in actions work correctly
- [ ] Filters combine with AND logic
- [ ] Actions chainable in sequence
- [ ] Plugin system works: adding a new filter/action requires no changes to selection engine

### Browser UI
- [ ] Export loads and tree renders correctly
- [ ] Map shows markers with correct visual states
- [ ] Click marker on map -> tree highlights, details update
- [ ] Check marker in tree -> map highlights, details update
- [ ] Filter bar generates correct filter config from plugin `config` schema
- [ ] "Select Matching" updates selection and all panels
- [ ] Photo-finder background invocation works and populates `missingPhotos` filter
- [ ] Existing manifest JSON can be loaded as alternative to background invocation
- [ ] Actions execute correctly with confirmation for destructive ones
- [ ] Export saves with backup
- [ ] Modified export passes validation
- [ ] Configuration paths pre-populate
- [ ] Layout works at 1280px+

### CLI Tool
- [ ] All filter flags parse correctly
- [ ] All action flags parse correctly
- [ ] `--dry-run` shows accurate preview
- [ ] `--backup` creates .bak file
- [ ] Modified exports pass validation
- [ ] Batch processing (glob patterns) works

### Photo Data Removal
- [ ] Strips only `imageData` property
- [ ] Photo objects remain with `id`, `filename`, `imageHash`, `markerId`, `createdDate`
- [ ] Export file size significantly reduced
- [ ] Export remains valid

### Photo Extraction
- [ ] Creates valid JPEG files from Base64 data
- [ ] Hash verification confirms extracted photos match original
- [ ] Organization schemes work: `by-map`, `by-marker-description`, `by-marker-number`, `flat`
- [ ] Marker numbers calculated correctly (chronological by `createdDate`)
- [ ] Filename filtering via photo-finder integration works

### Performance
- [ ] Load and render export with 500 markers: <2 seconds
- [ ] Apply filter on 500 markers: <50ms
- [ ] Tree expand/collapse 500 markers: <100ms
- [ ] Extract 100 photos: <10 seconds
- [ ] Memory usage: <500MB for 10K photos

---

## Example Workflows

### Workflow 1: Clean Up Merged Export (Primary Use Case)

**Scenario:** You merged exports from multiple field workers. You want to keep only markers placed by you (for which you have the source photos).

```
1. Open Export Transformer in browser
2. Load merged export: "Kaart Caestert 2026-06-03.json"
3. Click "Run Photo-Finder" — select the directory containing your source photos
   -> Photo Finder scans in background, finds 11 of 45 photo sets
   -> Map shows red rings around 34 markers with missing photos
   -> Tree shows ! badges on affected markers
   -> Filter summary: "34 of 45 markers have missing photos"
4. Click filter "Missing Photos" -> click "Select Matching"
   -> 34 of 45 markers selected (all the ones without source photos)
5. Review selection on map and in tree
6. Click "Delete Selected Markers"
7. Confirm: "Delete 34 markers and their photos?"
8. Save export as "Kaart Caestert (cleaned).json"
   -> Result: Export with only 11 markers — all your own work
```

### Workflow 2: Extract Photos Before Archiving

```
1. Load export
2. Select all markers (checkbox at export level)
3. Click "Extract Photos"
4. Choose output directory, scheme: "by-marker-description"
5. Execute -> photos extracted to organized folder structure
6. Click "Remove Photo Data" -> strips imageData, keeps metadata
7. Save export -> lightweight file for sharing, SnapSpot serves from local dir
```

### Workflow 3: Date-Based Cleanup

```
1. Load export
2. Set date filter: From 2026-05-01, To 2026-05-15
3. Click "Select Matching" -> old markers selected
4. Delete selected -> remove outdated work
```

### Workflow 4: Find Markers Without Photos

```
1. Load export
2. Click filter "No Photos"
3. Click "Select Matching" -> empty markers selected
4. Delete selected -> clean up markers that were never documented
```

### Workflow 5: CLI Automation

```bash
# Delete all markers with missing photos (run Photo Finder in background)
node export-transformer.js \
  --export "./exports/*.json" \
  --filter missingPhotos --search ./my-photos \
  --action deleteMarkers \
  --backup --output ./cleaned/

# Delete markers with missing photos (using existing manifest)
node export-transformer.js \
  --export my-site.json \
  --filter missingPhotos --manifest ./photo-finder-manifest.json \
  --action deleteMarkers \
  --backup

# Extract photos for all markers, then strip imageData (lightweight export)
node export-transformer.js \
  --export my-site.json \
  --select-all \
  --action extractPhotos --output ./photos --scheme by-marker-description \
  --action removePhotoData \
  --backup

# Remove markers older than a date (preview first)
node export-transformer.js \
  --export my-site.json \
  --filter dateRange --to 2026-01-01 \
  --action deleteMarkers \
  --dry-run
```

---

## Implementation Notes

### Selection State Architecture

```
                    SelectionState
                   (Set-based, pub/sub)
                   +-----------------+
                   | selectedMarkerIds|
                   | selectedPhotoIds |
                   | subscribers[]    |
                   +-------+---------+
                           | notify()
          +----------------+----------------+
          v                v                v
      TreeView         MapView        DetailsPanel
   (checkbox sync)  (dot colors)    (property display)
```

All three panels subscribe to the same `SelectionState` instance. When selection changes, all panels update. No panel directly modifies another panel's state.

### Tree Data Model

```javascript
// The tree renders this derived structure — built from exportData + selection + filter results
{
  type: 'export',
  label: 'Kaart Caestert (2026-06-03)',
  children: [{
    type: 'map',
    label: 'Kaart Caestert',
    markerCount: 45,
    photoCount: 112,
    children: [{
      type: 'marker',
      id: 'uuid-...',
      label: 'Front Entrance',
      photoCount: 3,
      date: '2026-05-12',
      status: 'ok',       // 'ok' | 'missing-photos' | 'no-embedded-data'
      selected: false,
      filtered: false,    // Matches active filter?
      children: [{
        type: 'photo',
        id: 'uuid-...',
        label: 'IMG_2401.jpg',
        size: '2.4 MB',
        status: 'found',  // 'found' | 'missing' | 'unknown'
        selected: false
      }, ...]
    }, ...]
  }]
}
```

### CanvasRenderer Reuse

The `CanvasRenderer` from `shared/utils/canvas-helpers.js` handles:
- Image loading and rendering
- Pan and zoom with mouse wheel + drag
- Coordinate transformation (screen <-> world)
- Redraw callbacks for overlays

The `MapView` class wraps it and adds:
- Marker drawing with visual states (color, size, ring)
- Click detection (distance from marker center)
- Tooltip on hover
- Selection sync with `SelectionState`

### Photo-Finder Integration

The Export Transformer integrates with Photo Finder in two ways:

**1. Background invocation (primary flow):**
- Calls `findPhotosForExport()` from the Photo Finder CLI programmatically
- Receives the internal manifest via `generateInternalManifest()` — the same API Organizer uses
- Photo search directory is pre-populated from config (`paths.photosDir`)
- Shows progress while scanning

**2. Load existing manifest (cached/offline flow):**
- User can load a previously-saved Photo Finder manifest JSON file
- Useful when photos are on an external drive that isn't currently connected
- Manifest captures the last-known state of photo locations

**Internal manifest format (from Photo Finder):**
```javascript
{
  export: { path, name, summary },
  search: { directories, options },
  results: { found: 95, missing: 5, duplicates: 2 },
  photos: [
    { filename: 'IMG_2401.jpg', markerId: 'uuid', status: 'found',
      foundPath: '/photos/2026-01/IMG_2401.jpg' },
    { filename: 'IMG_2403.jpg', markerId: 'uuid', status: 'missing',
      foundPath: null },
    // ...
  ]
}
```

This data feeds the `missingPhotos` filter and the visual indicators on map/tree.

### Directory Schemes (Photo Extraction)

- **`by-map`:** `output/MapName/photo-001.jpg`
- **`by-marker-description`:** `output/MapName/Front-Entrance/photo-001.jpg`
- **`by-marker-number`:** `output/MapName/marker-001/photo-001.jpg`
- **`flat`:** `output/photo-001.jpg` (hash suffix for collisions)

---

## Future Extensions (Post-7C)

The plugin architecture makes these straightforward:

- **New filters:** `hasDescription`, `photoCount` (range), `coordinateBounds` (map lasso), `customField`
- **New actions:** `mergeMarkers` (combine selected into one), `duplicateMarkers`, `setCustomMetadata`, `exportCSV`
- **Format transformation:** Add a `transformFormat` action that uses mapping files for CAD/FM app export
- **Marker splitting:** Revisit when SnapSpot PWA supports stacked marker UI (the action would be trivial to add to the plugin registry)

---

## Next Steps

After completing Phase 7C:
- Proceed to [Phase 7D: Organizer Tool](PHASE_7D_ORGANIZER.md)
- Photo extraction from Export Transformer can feed into Organizer for archival

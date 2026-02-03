# SnapSpot Utilities Suite

**Desktop tools for advanced SnapSpot data operations**

Version 1.0.0 | [Documentation](docs/) | [SnapSpot Main App](https://github.com/NielsIH/SnapSpot)

---

## Overview

SnapSpot Utilities is a collection of browser-based desktop tools for advanced operations on SnapSpot data. These utilities complement the main SnapSpot PWA with specialized features optimized for desktop workflows.

### Current Tools

#### 🗺️ Map Migrator
Transform marker coordinates from one map to another using reference point alignment. Perfect for:
- Upgrading to higher-resolution maps
- Migrating to updated floor plans
- Moving markers between different scans of the same location
- **Merging markers** from multiple exports onto the same map

**Two Migration Modes:**
- **Replace Mode:** Target is an image → Creates new export with transformed markers
- **Merge Mode:** Target is an export → Intelligently merges transformed markers with existing markers

**Duplicate Detection in Merge Mode (Optional):**
- **Default:** Add all as new (no duplicate detection)
- **Smart Detection:** Cascading strategy (photos → labels → coordinates)
- **Photo Filenames:** Match markers by 70%+ shared photo filenames
- **Label/Description:** Match markers by text (case-insensitive)
- **Coordinates:** Match within tolerance based on transformation quality (RMSE × 2.5)

**Status:** Available  
**Guide:** [Map Migrator Documentation](docs/map-migrator-guide.md) *(available after Phase 6)*

### Coming Soon

- **Format Converter** - Export to GeoJSON, CSV, KML
- **Batch Processor** - Bulk operations on multiple maps
- **Data Analyzer** - Statistics and visualizations

---

## Requirements

### System Requirements
- **Desktop/Laptop Computer** with 1280px+ screen width
- **Mouse and Keyboard** (touch input not supported)
- **Modern Web Browser:**
  - Chrome/Edge 90+
  - Firefox 88+
  - Safari 14+

### Usage Context
These are **desktop-only** tools designed for occasional workstation use. For day-to-day field operations, use the main SnapSpot PWA on mobile devices.

---

## Quick Start

### Download & Launch (Easiest Method)

1. **Download the latest release:**
   - Visit [Releases](https://github.com/NielsIH/SnapSpot-Utils/releases)
   - Download `snapspot-utils-v1.0.0.zip`
   - Extract to your preferred location

2. **Launch the utilities:**
   - **Windows:** Double-click `START.bat`
   - **Mac/Linux:** Run `./start.sh` (may need `chmod +x start.sh` first)
   
3. **Use the tools:**
   - Browser opens automatically to `http://localhost:8081`
   - Select a tool from the launcher page

**What the launcher does:**
- Auto-detects Node.js or Python on your system
- Starts local HTTP server on port 8081
- Opens your default browser automatically
- Shows clear error messages if no server runtime found

---

## Getting Started

**📘 Full Guide:** [Running Locally Documentation](docs/RUNNING_LOCALLY.md)

### Option 1: One-Click Launcher (Recommended)

Download a release and use `START.bat` (Windows) or `start.sh` (Mac/Linux). See [Quick Start](#quick-start) above.

### Option 2: Manual Server Start

If you prefer manual control or are running from a git clone:

```bash
# Navigate to the snapspot-utils directory
cd snapspot-utils

# Start a local HTTP server (Node.js)
# Use port 8081 to avoid conflicts with main SnapSpot PWA service worker
npx http-server -p 8081 --cors

# OR use Python
python -m http.server 8081

# Open in your browser
# http://localhost:8081
```

The index page will show all available utilities. Click on a tile to launch a tool.

### Option 3: Hosted Version *(future)*

Visit the hosted utilities site (URL TBD after deployment).

---

## Quick Start: Map Migrator

1. **Export from SnapSpot**
   - Open SnapSpot PWA
   - Navigate to Settings → Export Data
   - Export map with markers you want to migrate

2. **Launch Map Migrator**
   - Open `tools/map-migrator/index.html`

3. **Load Files**
   - Drag your SnapSpot export JSON to "Source Map"
   - Drag your target to "Target Map":
     - **Image file** (.jpg, .png, .webp) for Replace Mode
     - **SnapSpot export** (.json) for Merge Mode

4. **Select Reference Points**
   - Click corresponding locations on both maps (minimum 3 pairs)
   - Choose clear features like corners or fixtures

5. **Calculate & Preview**
   - Click "Calculate Transformation"
   - Review metrics (RMSE, scale, rotation)
   - Click "Preview" to see transformed marker positions

6. **Generate Export**
   - Click "Generate Export"
   - **Replace Mode:** Downloads new export with transformed markers
   - **Merge Mode:** 
     1. Choose merge strategy (add all new, by label, by coordinates, or both)
     2. Preview merge statistics showing how many markers will be added vs merged
     3. Download merged export
   - Download the migrated/merged JSON file

7. **Import to SnapSpot**
   - Open SnapSpot PWA
   - Navigate to Settings → Import Data
   - Import the migrated/merged file

---

## Architecture

```
snapspot-utils/
├── START.bat               # Windows launcher script
├── start.sh                # Mac/Linux launcher script  
├── index.html              # Tool selector page
├── shared/                 # Reusable components
│   ├── styles/            # Common CSS variables
│   └── utils/             # Shared JavaScript modules
├── core/                  # Business logic
│   └── transformation/    # Coordinate math (affine transforms)
├── lib/                   # Shared SnapSpot libraries (synced from main repo)
│   ├── snapspot-data/     # Data operations (parse, write, validate, merge)
│   ├── snapspot-image/    # Image utilities (conversion, hashing)
│   └── snapspot-storage/  # Storage integration
├── tools/                # Individual tools
│   └── map-migrator/     # Map migration tool
└── docs/                 # Documentation
```

**Design Principles:**
- **Modular:** Clean separation between tools and core logic
- **Shared Libraries:** Uses refactored SnapSpot libraries from `lib/` directory
- **Privacy-First:** All processing in-browser, no data uploaded
- **Standalone:** No build process, just open HTML files
- **Extensible:** Easy to add new tools and formats

---

## lib/ Directory Sync

The `lib/` directory contains shared code libraries synced from the [main SnapSpot repository](https://github.com/NielsIH/SnapSpot). These libraries handle data parsing, image processing, and storage operations.

**Sync Status:**
- **Last Sync:** 2026-02-03 (Initial standalone repo creation)
- **Source Commit:** [NielsIH/SnapSpot@main](https://github.com/NielsIH/SnapSpot)
- **Sync Method:** Manual copy

**When to Sync:**
- Bug fixes in data parsing or validation
- Schema changes to export format
- Image processing improvements
- New format support

For sync procedures, see [CONTRIBUTING.md](CONTRIBUTING.md#syncing-lib-from-main-snapspot-repo).

---

## Documentation

### For Users
- **Map Migrator Guide:** [docs/map-migrator-guide.md](docs/map-migrator-guide.md) *(Phase 6)*
- **Troubleshooting:** [docs/map-migrator-guide.md#troubleshooting](docs/map-migrator-guide.md#troubleshooting) *(Phase 6)*

### For Developers
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Technical Specs:** [docs/SPECIFICATIONS.md](docs/SPECIFICATIONS.md)
- **Implementation Plan:** [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)
- **Running Locally:** [docs/RUNNING_LOCALLY.md](docs/RUNNING_LOCALLY.md)

---

## Troubleshooting

For detailed troubleshooting guidance, see the full [Troubleshooting Guide](docs/TROUBLESHOOTING.md).

### Quick Solutions for Common Issues

#### Wrong Page Loads (SnapSpot Main App Instead of Utilities)

**Problem:** When accessing `http://localhost:8081`, you see the main SnapSpot PWA instead of the utilities page.

**Quick Fix:** Use the launcher scripts (START.bat or start.sh) which automatically use port 8081 to avoid conflicts. See [Troubleshooting Guide](docs/TROUBLESHOOTING.md#wrong-page-loads-snapspot-main-app-instead-of-utilities) for alternative solutions.

#### Launcher Script Won't Start

**Problem:** START.bat or start.sh shows "No HTTP server found"

**Quick Fix:** Install Node.js from https://nodejs.org/ or Python from https://www.python.org/downloads/

#### File Won't Load

**Problem:** Drag-and-drop or file picker doesn't work

**Quick Fix:** 
1. Ensure you're using HTTP server (not opening files directly)
2. Check file type is correct (.json for exports, .jpg/.png for images)
3. See [Troubleshooting Guide](docs/TROUBLESHOOTING.md#file-loading-issues) for more solutions

---

## Development Status

### Current Phase: Phase 4 Complete ✅ → Phase 5 Next ⏳

- [x] Feature branch created
- [x] Project structure defined
- [x] Architecture documented
- [x] Implementation plan created
- [x] **Phase 1: Core Transformation ✅ COMPLETE**
  - [x] Linear algebra utilities
  - [x] Affine transformation calculation
  - [x] Transform validation & quality metrics
  - [x] Unit tests with browser-based test runner (44 tests)
- [x] **Phase 2: Format Handlers ✅ COMPLETE**
  - [x] SnapSpot export parser
  - [x] Writer for migrated exports
  - [x] Validation utilities
  - [x] Integration tests (22 tests)
- [x] **Phase 3: Shared Utilities ✅ COMPLETE**
  - [x] Canvas rendering with pan/zoom
  - [x] File loading utilities
  - [x] CSS framework and variables
  - [x] Unit tests (27 tests)
- [x] **Phase 4: UI Foundation ✅ COMPLETE**
  - [x] Suite landing page with desktop warning
  - [x] Map Migrator HTML structure
  - [x] Dual-canvas layout with responsive design
  - [x] Tool-specific CSS styling (973 lines)
- [ ] Phase 5: Migration Tool Logic (next)
- [ ] Phase 6: Testing & Polish

**Total Tests:** 93 tests passing across 3 phases  
**Estimated Completion:** 5-7 days remaining

---

## Contributing

Contributions to SnapSpot Utilities are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Guidelines

- **lib/ Directory:** Do not modify directly - synced from [main SnapSpot repo](https://github.com/NielsIH/SnapSpot)
- **Code Style:** Follow JavaScript Standard Style (run `npm run lint:fix`)
- **Testing:** Add/update tests for new features (run `tests/test-runner.html`)
- **Documentation:** Update README.md and CHANGELOG.md for user-facing changes
- **Commit Format:** `type: description` (e.g., `feat: add new tool`, `fix: resolve parsing bug`)

### Development Workflow
1. Fork and clone repository
2. Create feature branch: `feature/my-new-tool`
3. Make changes and test thoroughly
4. Run `npm run lint:fix` and ensure all tests pass
5. Update documentation
6. Submit pull request

For details on:
- **lib/ sync procedure:** See [CONTRIBUTING.md#syncing-lib-from-main-snapspot-repo](CONTRIBUTING.md#syncing-lib-from-main-snapspot-repo)
- **Adding new tools:** See [CONTRIBUTING.md#adding-new-tools](CONTRIBUTING.md#adding-new-tools)
- **Release process:** See [CONTRIBUTING.md#release-process](CONTRIBUTING.md#release-process)

---

## Privacy & Security

- **No Server:** All processing happens in your browser
- **No Upload:** Your data never leaves your computer
- **No Tracking:** No analytics or telemetry
- **Local Only:** All files stay on your device

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

This project uses the same license as the [main SnapSpot application](https://github.com/NielsIH/SnapSpot).

---

## Support

- **Issues:** [GitHub Issues](https://github.com/NielsIH/SnapSpot-Utils/issues)
- **Documentation:** [docs/](docs/)
- **Main SnapSpot App:** [github.com/NielsIH/SnapSpot](https://github.com/NielsIH/SnapSpot)

---

## Acknowledgments

Built to extend [SnapSpot](https://github.com/NielsIH/SnapSpot) - a Progressive Web App for photo mapping.

# Changelog

All notable changes to SnapSpot Utilities will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Migrated to standalone repository from main SnapSpot repo
- Added one-click launcher scripts (START.bat and start.sh)

## [1.0.0] - 2026-02-03

### Added
- **Initial Release** - Standalone SnapSpot Utilities repository
- **Map Migrator Tool** - Transform marker coordinates between maps
  - Affine transformation using reference point alignment
  - Two migration modes: Replace (image target) and Merge (export target)
  - Intelligent duplicate detection in Merge mode:
    - Match by photo filenames (70%+ overlap)
    - Match by label/description
    - Match by coordinates (within RMSE × 2.5 tolerance)
  - Quality metrics (RMSE, scale, rotation) for transformation validation
  - Real-time preview of transformed marker positions
  - Export generation for both Replace and Merge modes

- **Core Libraries**
  - `core/transformation/` - Affine transformation mathematics
    - Least squares solver for transformation matrix
    - Quality metrics and validation
    - 44 unit tests
  - `core/formats/snapspot/` - SnapSpot export format handlers
    - Parser for reading exports
    - Writer for generating exports
    - Schema validator
    - 22 integration tests

- **Shared Libraries** (synced from main SnapSpot repo)
  - `lib/snapspot-data/` - Data operations (parse, write, validate, merge, split)
  - `lib/snapspot-image/` - Image utilities (Base64 conversion, SHA-256 hashing)
  - `lib/snapspot-storage/` - Storage integration layer

- **Shared Utilities**
  - `shared/utils/canvas-helpers.js` - Canvas rendering with pan/zoom
  - `shared/utils/file-loader.js` - Drag-and-drop file loading
  - `shared/styles/` - Common CSS framework
  - 27 unit tests for shared utilities

- **Testing Infrastructure**
  - Browser-based test runner (`tests/test-runner.html`)
  - 93 total tests across all modules
  - Test framework with async support

- **Documentation**
  - Architecture guide
  - Technical specifications
  - Implementation phase documentation
  - Running locally guide
  - Testing guide

- **Launcher Scripts**
  - `START.bat` - Windows one-click launcher
  - `start.sh` - Mac/Linux one-click launcher
  - Auto-detection of Node.js or Python
  - Automatic browser opening to localhost:8081

### Technical Details
- **Browser Support:** Chrome/Edge 90+, Firefox 88+, Safari 14+
- **Runtime Requirements:** Node.js (for http-server) OR Python 3.x
- **No Build Step:** Vanilla JavaScript with ES6 modules
- **Privacy-First:** All processing in-browser, no server uploads
- **Offline-Capable:** Works without internet connection after initial load

### Known Limitations
- Desktop-only (1280px+ screen width recommended)
- No touch input support (mouse and keyboard required)
- Some browsers may show CORS warnings when loading local files

---

## Release Notes Format

### Version Number Guidelines
- **Major (X.0.0):** Breaking changes, major new tools
- **Minor (1.X.0):** New features, new tools, significant enhancements
- **Patch (1.0.X):** Bug fixes, minor improvements, documentation updates

### Categories
- **Added:** New features, tools, or capabilities
- **Changed:** Changes to existing functionality
- **Deprecated:** Soon-to-be removed features
- **Removed:** Removed features
- **Fixed:** Bug fixes
- **Security:** Security improvements or fixes

[Unreleased]: https://github.com/NielsIH/SnapSpot-Utils/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/NielsIH/SnapSpot-Utils/releases/tag/v1.0.0

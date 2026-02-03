# Contributing to SnapSpot Utilities

Thank you for your interest in contributing to SnapSpot Utilities! This document provides guidelines for contributing to the project.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Syncing lib/ from Main SnapSpot Repo](#syncing-lib-from-main-snapspot-repo)
- [Adding New Tools](#adding-new-tools)
- [Code Style](#code-style)
- [Testing](#testing)
- [Release Process](#release-process)
- [Submitting Changes](#submitting-changes)

---

## Getting Started

### Prerequisites

- **Node.js** (for http-server and linting) OR **Python 3.x** (for local server)
- **Git** for version control
- **Modern web browser** (Chrome/Edge/Firefox/Safari latest versions)
- **Text editor** or IDE (VS Code recommended)

### Initial Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/SnapSpot-Utils.git
   cd SnapSpot-Utils
   ```

2. **Install development dependencies (optional):**
   ```bash
   npm install
   ```
   This installs StandardJS linter if you want to check code style.

3. **Start local server:**
   ```bash
   # Using launcher
   ./start.sh  # Mac/Linux
   START.bat   # Windows
   
   # OR manually
   npx http-server -p 8081 --cors
   ```

4. **Open in browser:**
   Navigate to `http://localhost:8081`

---

## Development Workflow

### Branch Strategy

- `main` - Stable releases only
- `feature/*` - New features or tools
- `fix/*` - Bug fixes
- `refactor/*` - Code refactoring
- `docs/*` - Documentation updates

### Typical Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-new-tool
   ```

2. **Make changes:**
   - Edit files
   - Test thoroughly
   - Add/update tests if applicable

3. **Check code style:**
   ```bash
   npm run lint       # Check for errors
   npm run lint:fix   # Auto-fix style issues
   ```

4. **Test changes:**
   - Run test suite: `http://localhost:8081/tests/test-runner.html`
   - Test manually in browser
   - Test on multiple browsers if possible

5. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add new coordinate transformation tool"
   ```
   
   **Commit message format:**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `refactor:` - Code refactoring
   - `docs:` - Documentation updates
   - `test:` - Test updates
   - `sync:` - lib/ directory sync from main repo

6. **Push and create pull request:**
   ```bash
   git push origin feature/my-new-tool
   ```
   Then create PR on GitHub.

---

## Syncing lib/ from Main SnapSpot Repo

The `lib/` directory contains shared libraries synced from the [main SnapSpot repository](https://github.com/NielsIH/SnapSpot). This section explains when and how to sync.

### When to Sync

Sync `lib/` when the main SnapSpot repo has:
- ✅ Bug fixes in data parsing or validation
- ✅ Schema changes to export format
- ✅ Image processing improvements
- ✅ New format support (e.g., new export versions)
- ✅ Security fixes in image processing
- ❌ PWA-specific changes (storage.js, app.js, etc.) - these stay in main repo only

**Recommended Frequency:**
- Check main repo weekly for `lib/` changes
- Sync immediately for critical bug fixes or security issues
- Batch minor improvements into monthly syncs

### Sync Procedure

#### Step 1: Identify Changes in Main Repo

```bash
# Clone main SnapSpot repo (if you don't have it)
git clone https://github.com/NielsIH/SnapSpot.git snapspot-main
cd snapspot-main

# Check recent changes to lib/
git log --since="2.weeks.ago" -- lib/

# Note the commit hash of changes you want to sync
```

#### Step 2: Copy lib/ Directory

```bash
# From main SnapSpot repo directory
cd path/to/snapspot-main

# Copy entire lib/ directory to SnapSpot-Utils repo
# (Adjust paths as needed for your setup)

# Mac/Linux:
cp -r lib/* path/to/SnapSpot-Utils/lib/

# Windows (PowerShell):
Copy-Item -Path "lib\*" -Destination "path\to\SnapSpot-Utils\lib\" -Recurse -Force

# Windows (Command Prompt):
xcopy /E /Y lib path\to\SnapSpot-Utils\lib\
```

#### Step 3: Verify Sync

```bash
# In SnapSpot-Utils repo
cd path/to/SnapSpot-Utils

# Run test suite to ensure nothing broke
# Open in browser: http://localhost:8081/tests/test-runner.html

# Check all 93 tests pass
# Pay special attention to:
# - lib/snapspot-data tests
# - lib/snapspot-image tests  
# - Integration tests
```

#### Step 4: Update Documentation

```bash
# Edit README.md to update sync status
# Find the "lib/ Directory Sync" section and update:
# - Last Sync date
# - Source Commit hash
```

Example:
```markdown
**Sync Status:**
- **Last Sync:** 2026-02-15
- **Source Commit:** [NielsIH/SnapSpot@a1b2c3d](https://github.com/NielsIH/SnapSpot/commit/a1b2c3d)
- **Sync Method:** Manual copy
```

#### Step 5: Commit Sync

```bash
git add lib/ README.md
git commit -m "sync: lib/ from SnapSpot@a1b2c3d

- Updated parser.js with schema v1.1 support
- Fixed image hashing for WebP formats
- Improved merge duplicate detection

Source: https://github.com/NielsIH/SnapSpot/commit/a1b2c3d"

git push origin main
```

**Commit Message Format:**
```
sync: lib/ from SnapSpot@{commit-hash}

- Bullet point summary of changes
- Another change
- Third change

Source: {GitHub commit URL}
```

### Sync Verification Checklist

Before pushing a lib/ sync, verify:

- [ ] All 93 tests pass in test runner
- [ ] No console errors when loading tools
- [ ] Map Migrator can load and parse test exports
- [ ] Export generation still works
- [ ] Image loading and hashing work correctly
- [ ] README.md sync status updated with:
  - [ ] Current date
  - [ ] Source commit hash with link
  - [ ] Brief description of changes
- [ ] Commit message follows format with source link

### When Sync Frequency Increases

If lib/ syncs exceed **1 per month**, consider automating with git subtree:

```bash
# One-time setup in SnapSpot-Utils repo
git remote add snapspot-main https://github.com/NielsIH/SnapSpot.git
git subtree add --prefix=lib snapspot-main main --squash

# Future syncs
git subtree pull --prefix=lib snapspot-main main --squash
```

Contact maintainers if you'd like to help implement this automation.

---

## Adding New Tools

### Tool Structure

Each tool should follow this structure:

```
tools/
└── my-new-tool/
    ├── index.html          # Tool entry point
    ├── tool.js             # Main tool logic
    ├── styles.css          # Tool-specific styles
    ├── ui-controller.js    # UI interactions (optional)
    └── README.md           # Tool documentation (optional)
```

### Implementation Steps

1. **Create tool directory:**
   ```bash
   mkdir -p tools/my-new-tool
   ```

2. **Create index.html:**
   - Import from `lib/snapspot-data`, `lib/snapspot-image`, `shared/utils`
   - Use `shared/styles/common.css` for consistent styling
   - Follow desktop-first design (1280px+ screens)

3. **Create tool.js with ES6 modules:**
   ```javascript
   import { parseExport } from '../../lib/snapspot-data/parser.js'
   import { writeExport } from '../../lib/snapspot-data/writer.js'
   // ... your tool logic
   ```

4. **Add tests (if applicable):**
   ```bash
   mkdir -p tools/my-new-tool/__tests__
   # Create test files following existing patterns
   ```

5. **Update main index.html:**
   Add tool tile to the launcher page with:
   - Tool name and description
   - Icon (emoji or SVG)
   - Link to `tools/my-new-tool/index.html`
   - Status badge (Available, Beta, Coming Soon)

6. **Update documentation:**
   - Add tool to README.md
   - Create user guide in `docs/` if needed
   - Update CHANGELOG.md

### Tool Guidelines

- **Desktop-Only:** Target 1280px+ screens, no mobile support
- **No Touch:** Mouse and keyboard only
- **Privacy-First:** All processing in-browser, no uploads
- **No Build:** Use vanilla JavaScript, no frameworks or build steps
- **ES6 Modules:** Use native imports, always include `.js` extension
- **Code Style:** Follow StandardJS (no semicolons, 2-space indent)
- **Documentation:** Clear user instructions and troubleshooting

---

## Code Style

### JavaScript

- **StandardJS** rules (no semicolons, 2-space indent)
- Run linter before committing:
  ```bash
  npm run lint:fix  # Auto-fix
  npm run lint      # Check only
  ```

- **ES6 Modules:** Always use `.js` extension in imports
  ```javascript
  // Good
  import { parseExport } from '../lib/snapspot-data/parser.js'
  
  // Bad  
  import { parseExport } from '../lib/snapspot-data/parser'
  ```

- **No Frameworks:** Vanilla JavaScript only

### HTML

- Semantic HTML5
- Descriptive IDs and classes
- Accessibility: proper ARIA labels, keyboard navigation

### CSS

- Use CSS variables from `shared/styles/variables.css`
- Mobile-first approach discouraged (desktop tools)
- Consistent spacing and naming conventions

### Comments

- Document complex logic
- Explain "why" not "what"
- JSDoc for public APIs

---

## Testing

### Running Tests

```bash
# Start local server
npx http-server -p 8081 --cors

# Open test runner in browser
# http://localhost:8081/tests/test-runner.html
```

### Test Structure

```
__tests__/
├── test-runner.html        # HTML test runner
├── my-module-tests.js      # Test suite
└── fixtures/               # Test data
    ├── sample-export.json
    └── test-image.jpg
```

### Writing Tests

```javascript
import { TestFramework } from '../../shared/test-framework.js'
import { myFunction } from '../my-module.js'

const tests = new TestFramework('My Module')

await tests.test('should do something', async () => {
  const result = await myFunction()
  tests.assertEqual(result, expectedValue, 'Result matches expected')
})

await tests.printSummary()
```

### Test Coverage

- All core modules should have tests
- UI code can be tested manually
- Aim for 80%+ coverage of logic code
- Include edge cases and error conditions

---

## Release Process

### Version Numbering

Semantic Versioning (SemVer):
- **Major (X.0.0):** Breaking changes, major architecture changes
- **Minor (1.X.0):** New tools, new features, significant enhancements
- **Patch (1.0.X):** Bug fixes, minor improvements, documentation

### Release Checklist

#### Pre-Release

- [ ] All tests pass (93/93)
- [ ] No console errors in tools
- [ ] lib/ sync status up to date in README
- [ ] CHANGELOG.md updated with version and changes
- [ ] Version bumped in 3 locations:
  - [ ] README.md (top of file)
  - [ ] CHANGELOG.md (new version section)
  - [ ] index.html (footer or meta tag)
- [ ] Documentation updated for new features
- [ ] Test on multiple browsers:
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari (if possible)

#### Creating Release

1. **Create release branch:**
   ```bash
   git checkout -b release/v1.1.0
   ```

2. **Update version files:**
   - README.md
   - CHANGELOG.md
   - index.html

3. **Commit and tag:**
   ```bash
   git add .
   git commit -m "chore: bump version to v1.1.0"
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin release/v1.1.0
   git push origin v1.1.0
   ```

4. **Merge to main:**
   ```bash
   git checkout main
   git merge release/v1.1.0
   git push origin main
   ```

5. **Create GitHub Release:**
   - Go to: https://github.com/NielsIH/SnapSpot-Utils/releases/new
   - Tag: `v1.1.0`
   - Title: `SnapSpot Utilities v1.1.0 - [Feature Name]`
   - Description: Copy relevant CHANGELOG.md section
   - Attach: `snapspot-utils-v1.1.0.zip` (see below)

#### Creating Release ZIP

```bash
# In repo root
# Exclude: .git, node_modules, .github, implementation docs

# Mac/Linux:
zip -r snapspot-utils-v1.1.0.zip . \
  -x "*.git*" "node_modules/*" ".github/*" \
  "docs/IMPLEMENTATION*.md" "docs/PHASE_*.md" \
  "docs/SPECIFICATIONS.md" "docs/TESTING_GUIDE.md" "docs/WORKFLOW.md"

# Windows (PowerShell):
Compress-Archive -Path * -DestinationPath snapspot-utils-v1.1.0.zip `
  -Exclude .git*,node_modules,.github,docs/IMPLEMENTATION*.md,docs/PHASE_*.md

# Manually verify ZIP contains:
# - START.bat, start.sh
# - index.html, README.md, LICENSE, CHANGELOG.md
# - lib/, core/, shared/, tools/, tests/
# - docs/ (keeping: RUNNING_LOCALLY.md, TROUBLESHOOTING.md, ARCHITECTURE.md)
```

#### Post-Release

- [ ] Verify release ZIP downloads and extracts correctly
- [ ] Test launcher scripts from extracted ZIP
- [ ] Announce release (if applicable)
- [ ] Update project boards/issues

---

## Submitting Changes

### Pull Request Process

1. **Create PR:**
   - Clear title describing change
   - Reference any related issues
   - Provide context and motivation

2. **PR Description Should Include:**
   - What changed and why
   - Testing performed
   - Screenshots (for UI changes)
   - Breaking changes (if any)
   - Checklist items completed

3. **PR Checklist:**
   - [ ] Code follows StandardJS style
   - [ ] Tests added/updated
   - [ ] All tests pass
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated (for user-facing changes)
   - [ ] No console warnings or errors

4. **Review Process:**
   - Maintainer will review within 1 week
   - Address feedback and requested changes
   - Once approved, maintainer will merge

### Issue Reporting

**Before creating issue:**
- Search existing issues
- Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- Try latest version

**Include in issue:**
- Clear description of problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS versions
- Console error messages (if any)
- Screenshots (if relevant)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and learners
- Focus on constructive feedback
- Assume good intentions

### Attribution

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

## Questions?

- **General Questions:** Open a [GitHub Discussion](https://github.com/NielsIH/SnapSpot-Utils/discussions)
- **Bug Reports:** [GitHub Issues](https://github.com/NielsIH/SnapSpot-Utils/issues)
- **Main SnapSpot Repo:** [github.com/NielsIH/SnapSpot](https://github.com/NielsIH/SnapSpot)

---

**Thank you for contributing to SnapSpot Utilities!**

Last Updated: 2026-02-03

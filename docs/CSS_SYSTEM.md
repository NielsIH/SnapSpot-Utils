# CSS System Documentation

## Overview

SnapSpot Utilities uses a unified CSS system across all tools for consistent styling and easier maintenance.

---

## CSS File Structure

### Shared Styles (`shared/styles/`)

All tools should import shared styles in this order:
1. `variables.css` (CSS custom properties)
2. `common.css` (base styles) or `launcher.css` (landing page only)
3. `utility.css` (utility classes)
4. Tool-specific `styles.css`

#### `variables.css`
- CSS custom properties (variables)
- Color palette
- Spacing scale
- Typography settings
- Border radius values
- Timing functions

**Usage:** Import in all HTML pages

```html
<link rel="stylesheet" href="../../shared/styles/variables.css">
```

#### `common.css`
- Base styles for all utilities
- Typography styles
- Form controls (inputs, buttons, selects)
- Cards and containers
- Navigation and breadcrumbs
- Footer styles

**Usage:** Import in all tool pages

```html
<link rel="stylesheet" href="../../shared/styles/common.css">
```

#### `utility.css` ✨ NEW
- Reusable utility classes
- Display utilities (`.hidden`, `.visible`)
- Spacing utilities (`.mt-1`, `.mb-2`)
- Text alignment (`.text-center`, `.text-left`)
- Flex utilities (`.flex`, `.flex-center`)
- Width utilities (`.w-full`, `.max-w-600`)

**Usage:** Import in all pages

```html
<link rel="stylesheet" href="../../shared/styles/utility.css">
```

#### `launcher.css` ✨ NEW
- Styles specific to main landing page (`index.html`)
- Tile grid layout
- Gradient background
- Desktop warning overlay
- Info boxes
- **Requires `variables.css`** for CSS custom properties

**Usage:** Import only in `index.html` (after `variables.css`)

```html
<link rel="stylesheet" href="shared/styles/variables.css">
<link rel="stylesheet" href="shared/styles/launcher.css">
```

---

## Utility Classes

### Display Utilities

```html
<!-- Hide element -->
<div class="hidden"></div>

<!-- Show element (block) -->
<div class="visible"></div>

<!-- Hide file inputs -->
<input type="file" class="file-input-hidden" />

<!-- Visually hidden but accessible to screen readers -->
<label class="visually-hidden">Select file</label>
```

### Spacing Utilities

```html
<!-- Margin top -->
<div class="mt-1"></div>  <!-- 0.5rem -->
<div class="mt-2"></div>  <!-- 1rem -->
<div class="mt-3"></div>  <!-- 1.5rem -->

<!-- Margin bottom -->
<div class="mb-1"></div>
<div class="mb-2"></div>
<div class="mb-3"></div>
```

### Text Utilities

```html
<div class="text-center">Centered text</div>
<div class="text-left">Left-aligned text</div>
<div class="text-right">Right-aligned text</div>
```

### Flex Utilities

```html
<!-- Basic flexbox -->
<div class="flex">...</div>

<!-- Flexbox with center alignment -->
<div class="flex-center">...</div>

<!-- Flexbox with space-between -->
<div class="flex-between">...</div>
```

### Width Utilities

```html
<div class="w-full">Full width</div>
<div class="max-w-600">Max 600px width</div>
<div class="max-w-800">Max 800px width</div>
```

---

## JavaScript Integration

### Show/Hide Elements

**❌ OLD WAY (Don't use):**
```javascript
element.style.display = 'none'
element.style.display = 'block'
```

**✅ NEW WAY (Use this):**
```javascript
// Hide element
element.classList.add('hidden')

// Show element
element.classList.remove('hidden')

// Toggle visibility
element.classList.toggle('hidden')

// Conditional visibility
element.classList.toggle('hidden', !shouldShow)
```

### Example: Toggle Visibility Based on Checkbox

```javascript
handleCheckboxChange() {
  const isChecked = this.checkbox.checked
  
  // Show/hide related section
  this.relatedSection.classList.toggle('hidden', !isChecked)
}
```

---

## Tool-Specific Styles

Each tool has its own `styles.css` for tool-specific components:

- `tools/map-migrator/styles.css` - Canvas styles, point markers, transformation UI
- `tools/config/styles.css` - Configuration form styles
- `tools/photo-finder-ui/styles.css` - Command display, report viewer, drop zones

**Pattern:**
1. Import shared styles first
2. Import utility classes
3. Import tool-specific styles last

```html
<head>
  <link rel="stylesheet" href="../../shared/styles/variables.css">
  <link rel="stylesheet" href="../../shared/styles/common.css">
  <link rel="stylesheet" href="../../shared/styles/utility.css">
  <link rel="stylesheet" href="styles.css">
</head>
```

---

## Migration Guide

### Converting Inline Styles to Utility Classes

#### Before:
```html
<div style="display: none;">Hidden content</div>
<div style="margin-top: 1rem;">Spaced content</div>
<input type="file" style="display: none;" />
```

#### After:
```html
<div class="hidden">Hidden content</div>
<div class="mt-2">Spaced content</div>
<input type="file" class="file-input-hidden" />
```

### Converting JavaScript Style Manipulation

#### Before:
```javascript
// Show/hide
dropZone.style.display = 'none'
viewer.style.display = 'block'

// Toggle based on condition
section.style.display = isVisible ? 'block' : 'none'
```

#### After:
```javascript
// Show/hide
dropZone.classList.add('hidden')
viewer.classList.remove('hidden')

// Toggle based on condition
section.classList.toggle('hidden', !isVisible)
```

---

## Best Practices

### 1. Prefer Utility Classes Over Inline Styles

**❌ Don't:**
```html
<div style="display: none;">...</div>
<div style="margin-top: 20px;">...</div>
```

**✅ Do:**
```html
<div class="hidden">...</div>
<div class="mt-3">...</div>
```

### 2. Use Semantic Class Names for Complex Components

**❌ Don't:**
```html
<div style="text-align: left; max-width: 600px; margin: 0 auto;">...</div>
```

**✅ Do:**
```html
<!-- In HTML -->
<div class="modal-help-content">...</div>

<!-- In CSS -->
.modal-help-content {
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}
```

### 3. Keep Tool-Specific Styles in Tool's CSS File

- **Modal layouts** → tool's `styles.css`
- **Custom components** → tool's `styles.css`
- **tool-specific animations** → tool's `styles.css`
- **Generic utilities** → `shared/styles/utility.css`

### 4. Use CSS Variables for Consistency

```css
/* ✅ Use variables */
.card {
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  color: var(--text-color);
}

/* ❌ Don't hardcode values */
.card {
  padding: 16px;
  border-radius: 8px;
  color: #333;
}
```

---

## Adding New Utilities

When you need a new utility class:

1. **Check if it exists** in `utility.css`
2. **If reusable across tools** → Add to `utility.css`
3. **If tool-specific** → Add to tool's `styles.css`
4. **Follow naming conventions:**
   - Display: `.hidden`, `.visible`
   - Spacing: `.mt-{n}`, `.mb-{n}` (1-3)
   - Text: `.text-{direction}`
   - Flex: `.flex`, `.flex-{pattern}`

### Example: Adding a New Spacing Utility

```css
/* In shared/styles/utility.css */

.mt-4 {
  margin-top: 2rem;
}

.mb-4 {
  margin-bottom: 2rem;
}
```

---

## Testing After CSS Changes

1. **Visual check** all pages:
   - Index page (`index.html`)
   - Configuration (`tools/config/`)
   - Map Migrator (`tools/map-migrator/`)
   - Photo Finder UI (`tools/photo-finder-ui/`)

2. **Test interactive behaviors:**
   - Show/hide toggles
   - Form interactions
   - Modal dialogs
   - Drop zones

3. **Run linter:**
   ```bash
   npm run lint
   ```

4. **Check browser console** for errors

---

## File Locations Quick Reference

```
shared/styles/
├── variables.css      # CSS custom properties
├── common.css         # Base styles for all tools
├── utility.css        # Utility classes (NEW)
└── launcher.css       # Landing page styles (NEW)

tools/*/styles.css     # Tool-specific styles

index.html             # Uses launcher.css
tools/*/index.html     # Use all shared styles + tool CSS
```

---

## Questions?

See examples in existing tools:
- **Photo Finder UI** - Full implementation of utility classes
- **Map Migrator** - Custom modal styles with utilities
- **Configuration** - Form styles with utilities

**Last Updated:** February 4, 2026 (Phase 7B)

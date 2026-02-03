# SnapSpot Utilities - Troubleshooting Guide

Common issues and solutions for SnapSpot Utilities.

---

## Table of Contents

- [Launcher Script Issues](#launcher-script-issues)
- [Server Issues](#server-issues)
- [Browser Issues](#browser-issues)
- [Map Migrator Issues](#map-migrator-issues)
- [File Loading Issues](#file-loading-issues)
- [Performance Issues](#performance-issues)

---

## Launcher Script Issues

### START.bat Won't Run (Windows)

**Problem:** Double-clicking START.bat shows error: "No HTTP server found!"

**Cause:** Neither Node.js nor Python is installed on your system.

**Solution:**
1. Install Node.js (recommended):
   - Download from: https://nodejs.org/
   - Choose LTS (Long Term Support) version
   - Run installer with default settings
   - Close and reopen START.bat

2. OR Install Python:
   - Download from: https://www.python.org/downloads/
   - Check "Add Python to PATH" during installation
   - Close and reopen START.bat

### start.sh Won't Run (Mac/Linux)

**Problem:** Running `./start.sh` shows "Permission denied"

**Cause:** Script doesn't have execute permissions.

**Solution:**
```bash
chmod +x start.sh
./start.sh
```

**Problem:** Script runs but browser doesn't open automatically.

**Cause:** No default browser launcher detected on your system.

**Solution:**
- Manually open your browser to: `http://localhost:8081`
- The server is still running correctly

### Port 8081 Already in Use

**Problem:** Launcher shows error about port 8081 being in use.

**Cause:** Another application is using port 8081.

**Solution:**
1. Stop the other application using port 8081
2. OR edit the launcher script to use a different port:
   - In START.bat: Change both instances of `8081` to `8082` (or other free port)
   - In start.sh: Change both instances of `8081` to `8082` (or other free port)
   - Update the URL in your browser accordingly

---

## Server Issues

### Wrong Page Loads (SnapSpot Main App Instead of Utilities)

**Problem:** When accessing `http://localhost:8081`, you see the main SnapSpot PWA instead of the utilities page.

**Cause:** The main SnapSpot app is a Progressive Web App (PWA) with a service worker that aggressively caches pages. If you previously ran the main app on the same port, its service worker is still active.

**Solutions:**

#### Solution 1: Use Different Port (Easiest)
The launcher scripts use port 8081 by default to avoid conflicts. If you're manually starting a server, use:
```bash
npx http-server -p 8081 --cors
```
Access at `http://localhost:8081` - Different port = no service worker conflict.

#### Solution 2: Clear Service Workers
1. Open browser DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. Find any localhost service workers
4. Click **Unregister** for each
5. Reload the page (Ctrl+R or Cmd+R)

#### Solution 3: Use Incognito/Private Browsing
- Chrome/Edge: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
- Firefox: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
- Safari: Cmd+Shift+N (Mac)

No cached service workers in private browsing mode.

#### Solution 4: Hard Refresh (Temporary)
- Windows: Ctrl+F5
- Mac: Cmd+Shift+R

Note: Normal reload may revert to cached version.

### CORS Errors in Console

**Problem:** Browser console shows errors like "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** Browser security restrictions when loading modules or files.

**Solution:**
1. Make sure you're using an HTTP server (not opening files directly)
2. If using `npx http-server`, add the `--cors` flag:
   ```bash
   npx http-server -p 8081 --cors
   ```
3. If using Python's http.server, CORS is enabled by default

### Module Loading Errors

**Problem:** Console shows "Failed to load module" or "Cannot find module"

**Cause:** Files are being opened directly in browser (file:// protocol) instead of through HTTP server.

**Solution:**
- Always use a local HTTP server (use launcher scripts or manual server start)
- Never open HTML files directly by double-clicking
- Check that the URL starts with `http://localhost:` not `file://`

---

## Browser Issues

### Tools Not Loading / Blank Page

**Problem:** Utilities page loads but tools don't appear or page is blank.

**Troubleshooting:**
1. Open browser console (F12)
2. Look for JavaScript errors in the Console tab
3. Common causes:
   - Module loading errors (use HTTP server, not file://)
   - CORS errors (add --cors flag to http-server)
   - JavaScript disabled (check browser settings)

### Browser Compatibility

**Minimum Requirements:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Not Supported:**
- Internet Explorer (any version)
- Chrome < 90
- Very old mobile browsers

**Check Your Browser Version:**
- Chrome/Edge: Settings → About Chrome/Edge
- Firefox: Help → About Firefox
- Safari: Safari → About Safari

### Canvas Not Rendering

**Problem:** Map images don't display in Map Migrator.

**Troubleshooting:**
1. Check browser console for errors
2. Verify image file is valid (try opening in image viewer)
3. Try smaller image (< 10MB recommended)
4. Check if browser has hardware acceleration enabled:
   - Chrome/Edge: Settings → System → Use hardware acceleration
   - Firefox: Settings → Performance → Use hardware acceleration

---

## Map Migrator Issues

### Transformation Quality Poor (High RMSE)

**Problem:** After calculating transformation, RMSE is very high (> 20 pixels) or preview shows misaligned markers.

**Causes & Solutions:**

#### Poor Reference Point Selection
- **Solution:** Choose clear, distinctive features
  - Good: Room corners, door frames, fixed equipment
  - Bad: Furniture, temporary objects, shadows
- Re-select reference points with better precision

#### Not Enough Reference Points
- **Solution:** Add more reference point pairs
  - Minimum: 3 pairs
  - Recommended: 4-6 pairs for better accuracy
  - More points = better averaging, more robust transformation

#### Maps Not Actually Matching
- **Solution:** Verify maps show the same location
  - Check if floor plan version changed significantly
  - Ensure maps are at compatible scales
  - Consider if transformation is actually feasible

#### Maps at Very Different Scales
- **Cause:** One map is significantly zoomed in/out compared to other
- **Solution:** This is OK, but RMSE will reflect scale difference
  - Check "Scale Factor" in metrics
  - Very large scale differences (> 3x or < 0.3x) may indicate wrong maps

### Reference Points Won't Place

**Problem:** Clicking on canvas doesn't create reference points.

**Troubleshooting:**
1. Ensure image is loaded first (wait for "Image loaded" message)
2. Check that you haven't exceeded maximum points (usually 10-12)
3. Try clicking in different area of canvas
4. Refresh page and reload files

### Export Generation Fails

**Problem:** "Generate Export" button doesn't work or produces invalid JSON.

**Troubleshooting:**
1. First calculate transformation successfully
2. Check browser console for errors
3. Ensure source export is valid:
   - Try opening in text editor
   - Verify it's valid JSON
   - Check file isn't corrupted

### Merge Mode Not Detecting Duplicates

**Problem:** Expected duplicate markers are being added as new markers instead of merged.

**Causes & Solutions:**

#### Wrong Merge Strategy Selected
- **Solution:** Try different detection methods:
  - "By Photo Filenames" requires 70%+ filename overlap
  - "By Label" requires exact text match (case-insensitive)
  - "By Coordinates" uses RMSE × 2.5 tolerance
  - "Label or Coordinates" tries both
  - "Add All as New" never merges (default)

#### Photo Filenames Don't Match
- **Cause:** Photos renamed or different naming conventions
- **Solution:** Use "By Label" or "By Coordinates" instead

#### Markers Too Far Apart
- **Cause:** Coordinate tolerance not wide enough
- **Solution:** 
  - Check transformation RMSE
  - Coordinate tolerance = RMSE × 2.5
  - Higher RMSE = wider tolerance = more merges

#### Labels Don't Match Exactly
- **Cause:** Different wording, typos, extra spaces
- **Solution:** Edit marker descriptions in SnapSpot before exporting to match exactly

---

## File Loading Issues

### Drag and Drop Not Working

**Problem:** Dragging files to drop zones doesn't load them.

**Troubleshooting:**
1. Check browser console for errors
2. Ensure you're dropping correct file type:
   - Source Map: `.json` file (SnapSpot export)
   - Target Map: `.json` (SnapSpot export) OR `.jpg/.png/.webp` (image)
3. Try file picker button instead (click the drop zone)
4. Check file isn't corrupted:
   - Open JSON in text editor, verify it's valid
   - Open image in image viewer, verify it displays

### Invalid Export File Error

**Problem:** Loading SnapSpot export shows "Invalid export file" or "Unsupported version"

**Causes & Solutions:**

#### Wrong File Type
- **Solution:** Make sure it's a SnapSpot export JSON file
  - Must be exported from SnapSpot app (Settings → Export)
  - Plain image files won't work for source map

#### Corrupted JSON
- **Solution:** Open file in text editor (Notepad, TextEdit, etc.)
  - Check it starts with `{` and ends with `}`
  - Look for obvious corruption
  - Try re-exporting from SnapSpot

#### Old Export Format
- **Solution:** Export format may be outdated
  - Check supported versions in console error
  - Re-export from latest SnapSpot version
  - Contact support if using current SnapSpot version

### Image Too Large / Browser Freezes

**Problem:** Loading very large images causes browser to freeze or crash.

**Causes & Solutions:**

#### Image Resolution Too High
- **Recommended:** Keep images under 4000×4000 pixels
- **Maximum:** ~8000×8000 pixels (depends on browser/system)
- **Solution:** Resize image before using:
  ```
  Windows: Paint, GIMP, IrfanView
  Mac: Preview (Tools → Adjust Size)
  Online: TinyPNG, Squoosh, etc.
  ```

#### Insufficient RAM
- **Solution:** Close other browser tabs and applications
- Try on computer with more RAM
- Reduce image resolution

### File Picker Not Opening

**Problem:** Clicking drop zone doesn't open file picker dialog.

**Troubleshooting:**
1. Check browser console for errors
2. Try drag-and-drop instead
3. Verify browser has file access permissions
4. Try different browser

---

## Performance Issues

### Slow Transformation Calculation

**Problem:** "Calculate Transformation" takes very long time.

**Causes:**
- Normal for large files or many reference points
- Complexity: O(n²) where n = number of reference points

**Solutions:**
- Use fewer reference points (4-6 is optimal balance)
- Be patient (even slow calculations complete within 10-30 seconds)
- Close other browser tabs to free up resources

### Slow Canvas Rendering / Laggy Pan/Zoom

**Problem:** Panning or zooming canvas is slow or jerky.

**Solutions:**
1. Reduce image resolution (see "Image Too Large" above)
2. Enable hardware acceleration:
   - Chrome/Edge: Settings → System → Hardware acceleration
   - Firefox: Settings → Performance → Hardware acceleration
3. Close other tabs and applications
4. Try on more powerful computer
5. Use smaller images for transformation, save full-resolution for final import

### Browser Memory Warnings

**Problem:** Browser shows "Page is using significant memory" or similar.

**Causes:**
- Large images loaded in both canvas panels
- Multiple tool tabs open simultaneously

**Solutions:**
1. Use only one tool at a time
2. Reduce image resolution
3. Close and reopen browser
4. Increase browser memory limits (advanced)

---

## Getting Help

If your issue isn't covered here:

1. **Check Documentation:**
   - [README.md](../README.md) - General overview
   - [RUNNING_LOCALLY.md](RUNNING_LOCALLY.md) - Setup guide
   - Tool-specific guides in `docs/`

2. **Check Browser Console:**
   - Press F12 to open DevTools
   - Look at Console tab for error messages
   - Include these errors when asking for help

3. **Report an Issue:**
   - Visit [GitHub Issues](https://github.com/NielsIH/SnapSpot-Utils/issues)
   - Search existing issues first
   - Provide:
     - Operating system and version
     - Browser and version
     - Steps to reproduce
     - Screenshots if applicable
     - Console error messages

4. **Main SnapSpot Support:**
   - For issues with the main SnapSpot PWA: [SnapSpot Issues](https://github.com/NielsIH/SnapSpot/issues)
   - For export/import questions: See main SnapSpot documentation

---

**Last Updated:** 2026-02-03

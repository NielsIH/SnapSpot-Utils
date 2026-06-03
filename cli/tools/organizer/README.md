# Organizer CLI

Create organized archives containing a SnapSpot export and original photos.

Organizer invokes Photo Finder internally for photo search and keeps UX focused on archive creation.

## Usage

Interactive mode:

```bash
npm run organizer
```

CLI mode:

```bash
npm run organizer -- \
  --export ./data.json \
  --search "C:\\Photos,C:\\Backup\\Photos" \
  --output ./archive \
  --scheme by-marker \
  --copy-export \
  --create-index

# Reuse an existing Photo Finder manifest instead of search paths
npm run organizer -- \
  --export ./data.json \
  --manifest ./output/MyMap_photo_manifest.json \
  --output ./archive \
  --scheme by-map
```

## Options

- `--export <path>`: SnapSpot export file
- `--search <paths>`: Comma-separated photo search directories
- `--manifest <path>`: Photo Finder manifest JSON (alternative to `--search`)
- `--output <path>`: Output archive directory
- `--scheme <by-map|by-marker|by-date|categorized|flat>`
- `--copy-export`: Include export file in archive
- `--create-index`: Generate index.html
- `--missing-ok`: Continue even when photos are missing
- `--dry-run`: Show archive plan without writing files
- `--report <path>`: Save organizer report (.txt, .json, .html)

## UX boundary

Organizer does not duplicate Photo Finder report and diagnostics UX.

- Organizer displays a compact search summary (found/missing/duplicates).
- Organizer handles organization scheme and copy operations.
- Use Photo Finder when detailed diagnostics are required:

```bash
npm run photo-finder -- --export ./data.json --search "C:\\Photos" --report --log

# Optional: save manifest for Organizer reuse
npm run photo-finder -- --export ./data.json --search "C:\\Photos" --manifest
```

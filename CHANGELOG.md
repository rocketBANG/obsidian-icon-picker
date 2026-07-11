# Changelog

## 1.0.1 (2026-07-11)

- **Popout window compatibility** — the Properties panel decoration now observes each markdown view's own container instead of the main window's document, so icon previews render and clean up correctly in popout windows.

## 1.0.0 (2026-07-11)

Initial release 🎉

Preview and pick [Lucide](https://lucide.dev) icons for a note's `icon` frontmatter property — the property the [Bases map view](https://obsidian.md/help/bases/views/map) reads for marker icons.

### Features

- **Icon preview** — notes with an `icon` property show the rendered Lucide icon next to the property value in the Properties panel (Live Preview and Reading mode) and inline in Source mode. Unknown icon names get a dimmed placeholder.
- **Click to change** — the rendered preview is a button; click it to open the picker.
- **Set icon for current note** command — fuzzy-search the full Lucide icon set with a live preview of every icon; picking one writes it to the note's frontmatter.
- **Remove icon from current note** command — deletes the property.
- **Configurable property name** — defaults to `icon` (what the Bases map view expects).

Icons are stored as plain Lucide names (e.g. `map-pin`), fully offline, with no runtime dependencies — Obsidian bundles the Lucide set natively.

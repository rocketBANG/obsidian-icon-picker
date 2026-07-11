import { getIcon, getIconIds } from "obsidian";

const LUCIDE_PREFIX = "lucide-";

/**
 * All Lucide icon names bundled with Obsidian, without the `lucide-` prefix —
 * the plain form (e.g. "map-pin") that the Bases map view expects in frontmatter.
 */
export function getLucideIconNames(): string[] {
	return getIconIds()
		.filter((id) => id.startsWith(LUCIDE_PREFIX))
		.map((id) => id.slice(LUCIDE_PREFIX.length))
		.sort();
}

/** Resolve an icon name (plain or lucide-prefixed) to an SVG element. */
export function resolveIcon(name: string): SVGSVGElement | null {
	return getIcon(name) ?? getIcon(LUCIDE_PREFIX + name);
}

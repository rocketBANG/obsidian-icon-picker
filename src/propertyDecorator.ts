import { MarkdownView } from "obsidian";
import type IconPickerPlugin from "./main";
import { resolveIcon } from "./icons";

const PREVIEW_CLASS = "icon-picker-property-preview";

/**
 * Renders the note's icon next to the icon property in the Properties panel
 * (Live Preview and Reading mode). The rendered icon doubles as a button that
 * opens the picker.
 *
 * Obsidian re-renders property rows outside of any plugin-visible event, so a
 * MutationObserver re-applies the decoration. Decoration is idempotent: if the
 * DOM already shows the right icon nothing is mutated, which is what stops the
 * observer from feeding back into itself.
 */
export class PropertyPanelDecorator {
	private observer: MutationObserver | null = null;
	private scheduled = false;

	constructor(private plugin: IconPickerPlugin) {}

	start(): void {
		const { plugin } = this;
		plugin.registerEvent(plugin.app.metadataCache.on("changed", () => this.schedule()));
		plugin.registerEvent(plugin.app.workspace.on("active-leaf-change", () => this.schedule()));
		plugin.registerEvent(plugin.app.workspace.on("layout-change", () => this.schedule()));
		plugin.registerEvent(plugin.app.workspace.on("file-open", () => this.schedule()));

		this.observer = new MutationObserver(() => this.schedule());

		this.schedule();
	}

	stop(): void {
		this.observer?.disconnect();
		this.observer = null;
		for (const view of this.markdownViews()) {
			view.containerEl.querySelectorAll("." + PREVIEW_CLASS).forEach((el) => el.remove());
		}
	}

	schedule(): void {
		if (this.scheduled) {
			return;
		}
		this.scheduled = true;
		window.requestAnimationFrame(() => {
			this.scheduled = false;
			this.decorateAll();
		});
	}

	private markdownViews(): MarkdownView[] {
		const views: MarkdownView[] = [];
		for (const leaf of this.plugin.app.workspace.getLeavesOfType("markdown")) {
			if (leaf.view instanceof MarkdownView) {
				views.push(leaf.view);
			}
		}
		return views;
	}

	private decorateAll(): void {
		for (const view of this.markdownViews()) {
			// Observe each view's own container rather than one global document:
			// views in popout windows live in other documents, which a single
			// document-level observer would never see. Re-observing an
			// already-observed node just replaces the registration, so this is
			// safe to repeat on every pass.
			this.observer?.observe(view.containerEl, { childList: true, subtree: true });
			this.decorateView(view);
		}
	}

	private decorateView(view: MarkdownView): void {
		const propertyName = this.plugin.settings.propertyName;
		const file = view.file;
		const rawValue: unknown = file
			? this.plugin.app.metadataCache.getFileCache(file)?.frontmatter?.[propertyName]
			: undefined;
		const iconName = typeof rawValue === "string" ? rawValue.trim() : "";

		const rows = view.containerEl.querySelectorAll<HTMLElement>(".metadata-property");
		for (const row of Array.from(rows)) {
			const existing = row.querySelector<HTMLElement>("." + PREVIEW_CLASS);
			if (row.getAttribute("data-property-key") !== propertyName || !iconName) {
				existing?.remove();
				continue;
			}
			if (existing?.dataset.icon === iconName) {
				continue;
			}
			existing?.remove();

			const valueEl = row.querySelector<HTMLElement>(".metadata-property-value");
			if (!valueEl) {
				continue;
			}
			// Prepend rather than append: the value input stretches to the full
			// row width on hover/focus, which would push a trailing icon to the
			// far right edge.
			valueEl.prepend(this.createPreviewButton(view, iconName));
		}
	}

	private createPreviewButton(view: MarkdownView, iconName: string): HTMLElement {
		const button = createSpan({
			cls: PREVIEW_CLASS,
			attr: {
				"data-icon": iconName,
				"aria-label": "Change icon",
				role: "button",
				tabindex: "0",
			},
		});

		const svg = resolveIcon(iconName);
		if (svg) {
			button.appendChild(svg);
		} else {
			// Unknown icon name: show a dimmed placeholder so the button stays usable.
			// The name differs across Lucide versions, so try both.
			const placeholder = resolveIcon("circle-help") ?? resolveIcon("help-circle");
			if (placeholder) {
				button.appendChild(placeholder);
			}
			button.addClass("is-unknown");
			button.setAttribute("aria-label", `Unknown icon "${iconName}" — click to change`);
		}

		button.addEventListener("mousedown", (event) => event.preventDefault());
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			const file = view.file;
			if (file) {
				this.plugin.openIconPicker(file);
			}
		});
		return button;
	}
}

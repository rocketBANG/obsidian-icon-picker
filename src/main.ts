import { MarkdownView, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, IconPickerSettings, IconPickerSettingTab } from "./settings";
import { iconDecoratorPlugin } from "./iconDecorator";

const ICON_MAP: Record<string, string> = {
	smile: "😊",
	frown: "😞",
};

export default class IconPickerPlugin extends Plugin {
	settings!: IconPickerSettings;
	private observer: MutationObserver | null = null;

	async onload() {
		await this.loadSettings();

		// Register the icon decorator editor extension (for Source mode)
		this.registerEditorExtension(iconDecoratorPlugin);

		// Handle Live Preview mode with Properties panel
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile && file.path === activeFile.path) {
					this.decoratePropertiesPanel();
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.decoratePropertiesPanel();
			})
		);

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.decoratePropertiesPanel();
			})
		);

		// Use MutationObserver to catch when properties panel is rendered
		this.setupMutationObserver();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new IconPickerSettingTab(this.app, this));
	}

	onunload() {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
		// Clean up any added decorations
		document.querySelectorAll(".icon-decorator-property-emoji").forEach((el) => el.remove());
	}

	private setupMutationObserver() {
		this.observer = new MutationObserver(() => {
			this.decoratePropertiesPanel();
		});

		// Observe the workspace for changes to catch properties panel rendering
		const workspace = document.querySelector(".workspace");
		if (workspace) {
			this.observer.observe(workspace, {
				childList: true,
				subtree: true,
			});
		}
	}

	private decoratePropertiesPanel() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			return;
		}

		const file = activeView.file;
		if (!file) {
			return;
		}

		const cache = this.app.metadataCache.getFileCache(file);
		const iconValue: unknown = cache?.frontmatter?.icon;

		if (!iconValue || typeof iconValue !== "string") {
			return;
		}

		const emoji = ICON_MAP[iconValue.toLowerCase()];
		if (!emoji) {
			return;
		}

		// Find the properties panel in this view
		const container = activeView.containerEl;
		const properties = container.querySelectorAll(".metadata-property");

		for (const prop of Array.from(properties)) {
			const keyInput = prop.querySelector(".metadata-property-key-input") as HTMLInputElement;
			const keyValue = keyInput?.value || keyInput?.textContent || "";

			if (keyValue.trim().toLowerCase() === "icon") {
				// Check if we already added the emoji
				if (prop.querySelector(".icon-decorator-property-emoji")) {
					return;
				}

				const valueEl = prop.querySelector(".metadata-property-value");
				if (valueEl instanceof HTMLElement) {
					valueEl.createSpan({
						cls: "icon-decorator-property-emoji",
						text: ` ${emoji}`,
					});
				}
				return;
			}
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<IconPickerSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

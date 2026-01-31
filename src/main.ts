import { MarkdownView, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from "./settings";
import { iconDecoratorPlugin } from "./iconDecorator";

const ICON_MAP: Record<string, string> = {
	smile: "😊",
	frown: "😞",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
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
		this.addSettingTab(new SampleSettingTab(this.app, this));
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
		console.log("decoratePropertiesPanel called");

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			console.log("No active MarkdownView");
			return;
		}

		const file = activeView.file;
		if (!file) {
			console.log("No file in view");
			return;
		}

		const cache = this.app.metadataCache.getFileCache(file);
		console.log("Cache:", cache);
		console.log("Frontmatter:", cache?.frontmatter);

		const iconValue = cache?.frontmatter?.icon;

		if (!iconValue || typeof iconValue !== "string") {
			console.log("No icon value found, iconValue:", iconValue);
			return;
		}

		const emoji = ICON_MAP[iconValue.toLowerCase()];
		if (!emoji) {
			console.log("No emoji for icon:", iconValue);
			return;
		}

		console.log("Looking for properties panel, emoji:", emoji);

		// Find the properties panel in this view
		const container = activeView.containerEl;
		const properties = container.querySelectorAll(".metadata-property");
		console.log("Found properties:", properties.length);

		// Debug: log all elements with "metadata" in class name
		const allMetadata = container.querySelectorAll("[class*='metadata']");
		console.log("All metadata elements:", allMetadata.length);
		allMetadata.forEach((el) => console.log("  -", el.className));

		for (const prop of Array.from(properties)) {
			const keyInput = prop.querySelector(".metadata-property-key-input") as HTMLInputElement;
			const keyValue = keyInput?.value || keyInput?.textContent || "";
			console.log("Property key:", keyValue);

			if (keyValue.trim().toLowerCase() === "icon") {
				// Check if we already added the emoji
				if (prop.querySelector(".icon-decorator-property-emoji")) {
					console.log("Emoji already exists");
					return;
				}

				const valueEl = prop.querySelector(".metadata-property-value");
				console.log("Value element:", valueEl);

				if (valueEl) {
					const emojiSpan = document.createElement("span");
					emojiSpan.className = "icon-decorator-property-emoji";
					emojiSpan.textContent = ` ${emoji}`;
					emojiSpan.style.marginLeft = "4px";
					valueEl.appendChild(emojiSpan);
					console.log("Emoji added!");
				}
				return;
			}
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

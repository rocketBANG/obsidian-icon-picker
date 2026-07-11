import { Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, IconPickerSettings, IconPickerSettingTab } from "./settings";
import { createIconDecorator } from "./iconDecorator";
import { PropertyPanelDecorator } from "./propertyDecorator";
import { IconPickerModal } from "./iconPickerModal";

export default class IconPickerPlugin extends Plugin {
	settings!: IconPickerSettings;
	private panelDecorator: PropertyPanelDecorator | null = null;

	async onload() {
		await this.loadSettings();

		// Inline preview in Source mode
		this.registerEditorExtension(createIconDecorator(this));

		// Icon preview + change button in the Properties panel (Live Preview / Reading mode)
		this.panelDecorator = new PropertyPanelDecorator(this);
		this.panelDecorator.start();

		this.addCommand({
			id: "set-note-icon",
			name: "Set icon for current note",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file || file.extension !== "md") {
					return false;
				}
				if (!checking) {
					this.openIconPicker(file);
				}
				return true;
			},
		});

		this.addCommand({
			id: "remove-note-icon",
			name: "Remove icon from current note",
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file || file.extension !== "md") {
					return false;
				}
				const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
				if (frontmatter?.[this.settings.propertyName] === undefined) {
					return false;
				}
				if (!checking) {
					void this.setNoteIcon(file, null);
				}
				return true;
			},
		});

		this.addSettingTab(new IconPickerSettingTab(this.app, this));
	}

	onunload() {
		this.panelDecorator?.stop();
		this.panelDecorator = null;
	}

	openIconPicker(file: TFile) {
		new IconPickerModal(this.app, (icon) => void this.setNoteIcon(file, icon)).open();
	}

	async setNoteIcon(file: TFile, icon: string | null) {
		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			if (icon) {
				frontmatter[this.settings.propertyName] = icon;
			} else {
				delete frontmatter[this.settings.propertyName];
			}
		});
	}

	/** Re-applies decorations after a settings change. */
	refreshDecorations() {
		this.app.workspace.updateOptions();
		this.panelDecorator?.schedule();
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

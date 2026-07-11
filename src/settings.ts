import { App, PluginSettingTab, Setting } from "obsidian";
import IconPickerPlugin from "./main";

export interface IconPickerSettings {
	propertyName: string;
}

export const DEFAULT_SETTINGS: IconPickerSettings = {
	propertyName: "icon",
};

export class IconPickerSettingTab extends PluginSettingTab {
	plugin: IconPickerPlugin;

	constructor(app: App, plugin: IconPickerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Property name")
			.setDesc(
				'Frontmatter property that stores the icon name. The map view in bases reads "icon".'
			)
			.addText((text) =>
				text
					.setPlaceholder("icon")
					.setValue(this.plugin.settings.propertyName)
					.onChange(async (value) => {
						this.plugin.settings.propertyName = value.trim() || DEFAULT_SETTINGS.propertyName;
						await this.plugin.saveSettings();
						this.plugin.refreshDecorations();
					})
			);
	}
}

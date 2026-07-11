import {App, PluginSettingTab, Setting} from "obsidian";
import IconPickerPlugin from "./main";

export interface IconPickerSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: IconPickerSettings = {
	mySetting: 'default'
}

export class IconPickerSettingTab extends PluginSettingTab {
	plugin: IconPickerPlugin;

	constructor(app: App, plugin: IconPickerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

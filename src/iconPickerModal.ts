import { App, FuzzyMatch, FuzzySuggestModal, setIcon } from "obsidian";
import { getLucideIconNames } from "./icons";

export class IconPickerModal extends FuzzySuggestModal<string> {
	private icons: string[];

	constructor(app: App, private onPick: (icon: string) => void) {
		super(app);
		this.icons = getLucideIconNames();
		this.setPlaceholder("Search icons…");
	}

	getItems(): string[] {
		return this.icons;
	}

	getItemText(item: string): string {
		return item;
	}

	renderSuggestion(match: FuzzyMatch<string>, el: HTMLElement): void {
		el.addClass("icon-picker-suggestion");
		const iconEl = el.createDiv({ cls: "icon-picker-suggestion-icon" });
		setIcon(iconEl, "lucide-" + match.item);
		const textEl = el.createDiv({ cls: "icon-picker-suggestion-text" });
		super.renderSuggestion(match, textEl);
	}

	onChooseItem(item: string): void {
		this.onPick(item);
	}
}

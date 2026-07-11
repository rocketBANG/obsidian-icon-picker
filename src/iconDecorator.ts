import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { getFrontMatterInfo } from "obsidian";

const ICON_MAP: Record<string, string> = {
	smile: "😊",
	frown: "😞",
};

class EmojiWidget extends WidgetType {
	constructor(private emoji: string) {
		super();
	}

	toDOM(): HTMLElement {
		return createSpan({
			cls: "icon-decorator-emoji",
			text: ` ${this.emoji}`,
		});
	}

	eq(other: EmojiWidget): boolean {
		return this.emoji === other.emoji;
	}
}

function buildDecorations(view: EditorView): DecorationSet {
	const content = view.state.doc.toString();
	const fmInfo = getFrontMatterInfo(content);

	if (!fmInfo.exists) {
		return Decoration.none;
	}

	const frontmatter = content.slice(0, fmInfo.contentStart);
	const iconMatch = frontmatter.match(/^icon:\s*["']?(\w+)["']?\s*$/m);

	if (!iconMatch || !iconMatch[1]) {
		return Decoration.none;
	}

	const iconValue = iconMatch[1].toLowerCase();
	const emoji = ICON_MAP[iconValue];

	if (!emoji) {
		return Decoration.none;
	}

	// Find position of the icon value in the document
	const matchStart = frontmatter.indexOf(iconMatch[0]);
	const matchEnd = matchStart + iconMatch[0].trimEnd().length;

	const widget = Decoration.widget({
		widget: new EmojiWidget(emoji),
		side: 1,
	});

	return Decoration.set([widget.range(matchEnd)]);
}

class IconDecoratorPlugin {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = buildDecorations(view);
	}

	update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged) {
			this.decorations = buildDecorations(update.view);
		}
	}
}

export const iconDecoratorPlugin = ViewPlugin.fromClass(IconDecoratorPlugin, {
	decorations: (v) => v.decorations,
});

import { Extension } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { editorInfoField, getFrontMatterInfo } from "obsidian";
import type IconPickerPlugin from "./main";
import { resolveIcon } from "./icons";

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Source-mode editor extension: renders the Lucide icon inline after the
 * frontmatter icon value. Clicking it opens the picker. (Live Preview shows
 * frontmatter as the Properties panel, which PropertyPanelDecorator handles.)
 */
export function createIconDecorator(plugin: IconPickerPlugin): Extension {
	class IconWidget extends WidgetType {
		constructor(private icon: string) {
			super();
		}

		toDOM(view: EditorView): HTMLElement {
			const span = createSpan({
				cls: "icon-picker-inline-preview",
				attr: { "aria-label": "Change icon", role: "button" },
			});
			const svg = resolveIcon(this.icon);
			if (svg) {
				span.appendChild(svg);
			}
			span.addEventListener("mousedown", (event) => event.preventDefault());
			span.addEventListener("click", (event) => {
				event.preventDefault();
				const file = view.state.field(editorInfoField).file;
				if (file) {
					plugin.openIconPicker(file);
				}
			});
			return span;
		}

		eq(other: IconWidget): boolean {
			return this.icon === other.icon;
		}
	}

	function buildDecorations(view: EditorView): DecorationSet {
		const content = view.state.doc.toString();
		const fmInfo = getFrontMatterInfo(content);
		if (!fmInfo.exists) {
			return Decoration.none;
		}

		const frontmatter = content.slice(0, fmInfo.contentStart);
		const pattern = new RegExp(
			`^${escapeRegExp(plugin.settings.propertyName)}:[ \\t]*["']?([\\w-]+)["']?[ \\t]*$`,
			"m"
		);
		const match = pattern.exec(frontmatter);
		if (!match?.[1] || match.index === undefined) {
			return Decoration.none;
		}

		if (!resolveIcon(match[1])) {
			return Decoration.none;
		}

		const widgetPos = match.index + match[0].trimEnd().length;
		const widget = Decoration.widget({
			widget: new IconWidget(match[1]),
			side: 1,
		});
		return Decoration.set([widget.range(widgetPos)]);
	}

	class IconDecoratorView {
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

	return ViewPlugin.fromClass(IconDecoratorView, {
		decorations: (v) => v.decorations,
	});
}

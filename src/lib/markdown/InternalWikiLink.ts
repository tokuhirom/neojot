import {Decoration, type EditorView, ViewPlugin, type ViewUpdate, WidgetType} from "@codemirror/view";
import {type RangeSet, RangeSetBuilder, type RangeValue} from "@codemirror/state";

class InternalLinkWidget extends WidgetType {
    constructor(readonly linkText: string, readonly onClick: () => void) {
        super();
    }

    toDOM() {
        const span = document.createElement('span');
        span.className = "internal-link"
        span.textContent = this.linkText;
        span.addEventListener('click', this.onClick);
        return span;
    }

    ignoreEvent() {
        return false;
    }
}


export const internalLinkDecorator = ViewPlugin.fromClass(class {
    decorations: RangeSet<RangeValue>;

    constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view: EditorView): RangeSet<RangeValue> {
        const builder = new RangeSetBuilder();
        const re = /\[\[(.*?)]]/g; // 内部リンクの正規表現
        for (let {from, to} of view.visibleRanges) {
            const text = view.state.doc.sliceString(from, to);
            let match;
            while ((match = re.exec(text))) {
                const linkText = match[0];
                const widget = new InternalLinkWidget(linkText, () => {
                    console.log(`${linkText} was clicked`);
                });
                const pos = from + match.index;
                builder.add(pos, pos + match[0].length, Decoration.mark({
                    class: 'internal-link',
                }));
            }
        }
        return builder.finish();
    }
}, {
    decorations: v => v.decorations
});


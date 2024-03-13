import {
    Decoration,
    type EditorView,
    ViewPlugin,
    type ViewUpdate,
} from '@codemirror/view';
import {
    type RangeSet,
    RangeSetBuilder,
    type RangeValue,
} from '@codemirror/state';

export const internalLinkDecorator = ViewPlugin.fromClass(
    class {
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
            const re = /\[\[([^|]+?)]]/g; // 内部リンクの正規表現
            for (const { from, to } of view.visibleRanges) {
                const text = view.state.doc.sliceString(from, to);
                let match;
                while ((match = re.exec(text))) {
                    const pos = from + match.index;
                    builder.add(
                        pos,
                        pos + match[0].length,
                        Decoration.mark({
                            class: 'internal-link',
                        }),
                    );
                }
            }
            return builder.finish();
        }
    },
    {
        decorations: (v) => v.decorations,
    },
);

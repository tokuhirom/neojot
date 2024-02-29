import { type RangeSet, RangeSetBuilder } from '@codemirror/state';
import {
    Decoration,
    type EditorView,
    ViewPlugin,
    ViewUpdate,
} from '@codemirror/view';

const colorMap: Record<string, string> = {
    done: 'green',
    todo: '#ffcc00',
    canceled: 'gray',
    plan: 'dodgerblue',
};

export const todoPlugin = ViewPlugin.fromClass(
    class {
        decorations: RangeSet<Decoration>;

        constructor(view: EditorView) {
            this.decorations = this.computeDecorations(view);
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.selectionSet) {
                this.decorations = this.computeDecorations(update.view);
            }
        }

        computeDecorations(view: EditorView): RangeSet<Decoration> {
            const builder = new RangeSetBuilder<Decoration>();
            for (const { from, to } of view.visibleRanges) {
                const text = view.state.doc.sliceString(from, to);
                const keywordRegex = /(DONE|TODO|CANCELED|PLAN)\[.*?]: /g;
                let match;
                while ((match = keywordRegex.exec(text))) {
                    const start = from + match.index;
                    const end = start + match[0].length;
                    builder.add(
                        start,
                        end,
                        Decoration.mark({
                            class: match[1].toLowerCase(),
                            attributes: {
                                style: `color: ${colorMap[match[1].toLowerCase()] || 'black'}`,
                            },
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

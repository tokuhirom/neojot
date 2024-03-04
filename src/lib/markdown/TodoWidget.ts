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
    doing: 'orange',
    note: 'magenta',
};

function replaceLine(
    view: EditorView,
    replacer: (type: string, param: string, title: string) => string,
) {
    // replace the current line with 'NOTE'
    const { state } = view;
    const { from, to } = state.selection.main;
    const lineStart = state.doc.lineAt(from).from;
    const lineEnd = state.doc.lineAt(to).to;
    const lineText = state.doc.sliceString(lineStart, lineEnd);
    const modifiedText = lineText.replace(
        /^(DONE|TODO|CANCELED|PLAN|DOING|NOTE)\[(.*?)]:(.*)$/,
        (_all, type, param, title) => {
            console.log('type:', type);
            return replacer(type, param, title);
        },
    );

    view.dispatch({
        changes: {
            from: lineStart,
            to: lineEnd,
            insert: modifiedText,
        },
    });
}

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
                const keywordRegex =
                    /(DONE|TODO|CANCELED|PLAN|DOING|NOTE)\[.*?]: /g;
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
        eventHandlers: {
            keydown: (event, view) => {
                // when user press the 'n' key, update line to 'NOTE'
                if (event.key === 'n') {
                    console.log('n key pressed');
                    event.preventDefault();
                    event.stopPropagation();
                    replaceLine(view, (type, param, title) => {
                        const newType = type === 'NOTE' ? 'TODO' : 'NOTE';
                        return `${newType}[${param}]:${title}`;
                    });
                } else if (event.key === 'i') {
                    console.log('i key pressed');
                    event.preventDefault();
                    event.stopPropagation();
                    replaceLine(view, (type, param, title) => {
                        const newType = type === 'DOING' ? 'TODO' : 'DOING';
                        return `${newType}[${param}]:${title}`;
                    });
                }
            },
        },
    },
);

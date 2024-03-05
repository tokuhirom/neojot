import { type RangeSet, RangeSetBuilder } from '@codemirror/state';
import {
    Decoration,
    type EditorView,
    ViewPlugin,
    ViewUpdate,
} from '@codemirror/view';
import { format } from 'date-fns';

const colorMap: Record<string, string> = {
    done: 'green',
    todo: '#ffcc00',
    canceled: 'gray',
    plan: 'dodgerblue',
    doing: 'orange',
    note: 'magenta',
};

function currentDate() {
    return format(new Date(), 'yyyy-MM-dd(EEE)');
}

function replaceLine(
    event: KeyboardEvent,
    view: EditorView,
    replacer: (type: string, param: string, title: string) => string,
) {
    // replace the current line with 'NOTE'
    const { state } = view;
    const { from, to } = state.selection.main;
    const lineStart = state.doc.lineAt(from).from;
    const lineEnd = state.doc.lineAt(to).to;
    const lineText = state.doc.sliceString(lineStart, lineEnd);
    const match = /^(DONE|TODO|CANCELED|PLAN|DOING|NOTE)\[.*?\]:/.exec(
        lineText,
    );
    if (!match || from > lineStart + match[0].length) {
        // カーソル位置がパターンにマッチしない場合、または`:`の後ろにある場合は処理をスキップ
        return;
    }

    const modifiedText = lineText.replace(
        /^(DONE|TODO|CANCELED|PLAN|DOING|NOTE)\[(.*?)]:(.*)$/,
        (_all, type, param, title) => {
            console.log('type:', type);
            return replacer(type, param, title);
        },
    );
    if (modifiedText === lineText) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
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
                if (
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.metaKey
                ) {
                    return;
                }

                // when user press the 'n' key, update line to 'NOTE'
                if (event.key === 'n') {
                    replaceLine(event, view, (type, param, title) => {
                        const newType = type === 'NOTE' ? 'TODO' : 'NOTE';
                        return `${newType}[${param}]:${title}`;
                    });
                } else if (event.key === 'i') {
                    replaceLine(event, view, (type, param, title) => {
                        const newType = type === 'DOING' ? 'TODO' : 'DOING';
                        return `${newType}[${param}]:${title}`;
                    });
                } else if (event.key === 'c') {
                    replaceLine(event, view, (type, param, title) => {
                        if (!param.match(/Finished:/)) {
                            param = `Finished:${currentDate()} ${param}`;
                        }
                        return `CANCELED[${param}]:${title}`;
                    });
                } else if (event.key === 'Enter') {
                    replaceLine(event, view, (type, param, title) => {
                        if (!param.match(/Finished:/)) {
                            param = `Finished:${currentDate()} ${param}`;
                        }
                        return `DONE[${param}]:${title}`;
                    });
                } else if (event.key === 's') {
                    replaceLine(event, view, (type, param, title) => {
                        // if 'Scheduled:' is not included in param, add it.
                        if (!param.match(/Scheduled:/)) {
                            param = `Scheduled:${currentDate()} ${param}`;
                        }
                        return `${type}[${param}]:${title}`;
                    });
                } else if (event.key === 'd') {
                    replaceLine(event, view, (type, param, title) => {
                        // if 'Deadline:' is not included in param, add it.
                        if (!param.match(/Deadline:/)) {
                            param = `Deadline:${currentDate()} ${param}`;
                        }
                        return `${type}[${param}]:${title}`;
                    });
                }
            },
        },
    },
);

import { type RangeSet, RangeSetBuilder } from '@codemirror/state';
import {
    Decoration,
    type EditorView,
    type KeyBinding,
    ViewPlugin,
    ViewUpdate,
} from '@codemirror/view';
import { addDays, format, parse, subDays } from 'date-fns';

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

function replaceDate(event: KeyboardEvent, view: EditorView, key: string) {
    const { state } = view;
    const { from, to } = state.selection.main;
    let extendedFrom = from - 15; // Extend the search area around the cursor to capture the date
    let extendedTo = to + 15;
    extendedFrom = extendedFrom < 0 ? 0 : extendedFrom; // Ensure we don't go below document start
    extendedTo = extendedTo > state.doc.length ? state.doc.length : extendedTo; // Ensure we don't go past document end

    const surroundingText = state.doc.sliceString(extendedFrom, extendedTo);
    const dateRegex = /\d{4}-\d{2}-\d{2}\(\w{3}\)/g; // Match dates in the format YYYY-MM-DD(Day)
    let match;
    while ((match = dateRegex.exec(surroundingText)) !== null) {
        const dateStr = match[0];
        const date = parse(dateStr, 'yyyy-MM-dd(E)', new Date());
        let updatedDate;
        if (key === '+') {
            updatedDate = addDays(date, 1);
        } else if (key === '-') {
            updatedDate = subDays(date, 1);
        } else {
            return; // If the key is neither '+' nor '-', do nothing
        }
        const formattedDate = format(updatedDate, 'yyyy-MM-dd(EEE)');
        const startIndex = extendedFrom + match.index;
        const endIndex = startIndex + dateStr.length;

        // Update only if the cursor is within the matched date string
        if (from >= startIndex && to <= endIndex) {
            event.preventDefault();
            event.stopPropagation();
            view.dispatch({
                changes: {
                    from: startIndex,
                    to: endIndex,
                    insert: formattedDate,
                },
            });
            break; // Assume only one date is to be updated per key press
        }
    }
}
function replaceLine(
    view: EditorView,
    replacer: (type: string, param: string, title: string) => string,
): boolean {
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
        return false;
    }

    const modifiedText = lineText.replace(
        /^(DONE|TODO|CANCELED|PLAN|DOING|NOTE)\[(.*?)]:(.*)$/,
        (_all, type, param, title) => {
            console.log('type:', type);
            return replacer(type, param, title);
        },
    );
    if (modifiedText === lineText) {
        return false;
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
    return true;
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
                if (event.ctrlKey || event.altKey || event.metaKey) {
                    return;
                }

                if (event.key === '+' || event.key === '-') {
                    replaceDate(event, view, event.key);
                    return;
                }
            },
        },
    },
);

export function insertDateCommand(view: EditorView, key: string) {
    const dateStr =
        `${key}[Scheduled:` + format(new Date(), 'yyyy-MM-dd(EEE)') + ']: ';
    const from = view.state.selection.main.from;
    const to = from + dateStr.length;

    view.dispatch({
        changes: { from: from, insert: dateStr },
        selection: { anchor: to },
    });
    return true;
}

export const taskKeymap: KeyBinding[] = [
    // task related -----------------------------------------
    { key: 'Mod-t', run: (view) => insertDateCommand(view, 'TODO') },
    { key: 'Mod-p', run: (view) => insertDateCommand(view, 'PLAN') },
    {
        key: 'Enter',
        run: (view) =>
            replaceLine(view, (type, param, title) => {
                if (!param.match(/Finished:/)) {
                    param = `Finished:${currentDate()} ${param}`;
                }
                return `DONE[${param}]:${title}`;
            }),
    },
    {
        key: 'n',
        run: (view) =>
            replaceLine(view, (type, param, title) => {
                const newType = type === 'NOTE' ? 'TODO' : 'NOTE';
                return `${newType}[${param}]:${title}`;
            }),
    },
    {
        key: 'd',
        run: (view) =>
            replaceLine(view, (type, param, title) => {
                // if 'Deadline:' is not included in param, add it.
                if (!param.match(/Deadline:/)) {
                    param = `Deadline:${currentDate()} ${param}`;
                }
                return `${type}[${param}]:${title}`;
            }),
    },
    {
        key: 's',
        run: (view) =>
            replaceLine(view, (type, param, title) => {
                // if 'Scheduled:' is not included in param, add it.
                if (!param.match(/Scheduled:/)) {
                    param = `Scheduled:${currentDate()} ${param}`;
                }
                return `${type}[${param}]:${title}`;
            }),
    },
    {
        key: 'c',
        run: (view) =>
            replaceLine(view, (type, param, title) => {
                if (!param.match(/Finished:/)) {
                    param = `Finished:${currentDate()} ${param}`;
                }
                return `CANCELED[${param}]:${title}`;
            }),
    },
    {
        key: 'i',
        run: (view) =>
            replaceLine(view, (type, param, title) => {
                const newType = type === 'DOING' ? 'TODO' : 'DOING';
                return `${newType}[${param}]:${title}`;
            }),
    },
];

import {
    Decoration,
    type EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { type Task } from '../task/Task';
import TaskWidgetInner from './TaskWidgetInner.svelte';
import { tasksStore } from '../../Stores';

class TaskWidget extends WidgetType {
    private inner: TaskWidgetInner | undefined = undefined;

    constructor() {
        super();
    }

    toDOM() {
        const container = document.createElement('div');
        container.className = 'task-widget';
        tasksStore.subscribe((tasks: Task[]) => {
            if (this.inner) {
                this.inner.$$set({ tasks });
            } else {
                this.inner = new TaskWidgetInner({
                    target: container,
                    props: {
                        tasks,
                    },
                });
            }
        });
        return container;
    }
}

export function taskPlugin() {
    return ViewPlugin.fromClass(
        class {
            decorations;

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet) {
                    this.decorations = this.buildDecorations(update.view);
                }
            }

            buildDecorations(view: EditorView) {
                const builder = new RangeSetBuilder();

                for (const { from, to } of view.visibleRanges) {
                    const text = view.state.doc.sliceString(from, to);
                    const keywordRegex = /%tasks/g;
                    let match;
                    while ((match = keywordRegex.exec(text))) {
                        const keywordStart = from + match.index;
                        const keywordEnd = keywordStart + match[0].length;
                        const textDecoration = Decoration.mark({
                            attributes: {
                                style: 'color: yellow;', // 色を変更したいスタイル
                            },
                        });
                        builder.add(keywordStart, keywordEnd, textDecoration);

                        const pos = from + match.index + match[0].length;
                        builder.add(
                            pos,
                            pos,
                            Decoration.widget({
                                widget: new TaskWidget(),
                                side: 1,
                                attributes: {
                                    style: 'color: yellow',
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
}

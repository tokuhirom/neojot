import {
    Decoration,
    type EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { type Task } from '../task/Task';
import type { FileItem } from '../file_item/FileItem';
import TaskWidgetInner from './TaskWidgetInner.svelte';
import { tasksStore } from '../../Stores';
import type { Unsubscriber } from 'svelte/store';

const taskWidgetInners: TaskWidgetInner[] = [];

function debounce(
    func: (tasks: Task[]) => void,
    delay: number,
): (tasks: Task[]) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return function (tasks: Task[]): void {
        clearTimeout(timeoutId as ReturnType<typeof setTimeout>);
        timeoutId = setTimeout(() => {
            func(tasks);
        }, delay);
    };
}

const debouncedUpdateTask = debounce((tasks: Task[]) => {
    if (taskWidgetInners.length > 0) {
        console.log(
            `TaskPlugin: sort_file_list event received: ${taskWidgetInners.length} tasks: ${tasks.length}`,
        );
        taskWidgetInners.forEach((taskWidgetInner) => {
            taskWidgetInner.$$set({ tasks });
        });
    }
}, 1000);

tasksStore.subscribe((tasks: Task[]) => {
    console.log(`TaskPlugin: tasksStore.subscribe: ${tasks.length}`);
    debouncedUpdateTask(tasks);
});

class TaskWidget extends WidgetType {
    constructor() {
        super();
    }

    toDOM() {
        const container = document.createElement('div');
        container.className = 'task-widget';
        let unsubscriber: Unsubscriber | undefined;
        unsubscriber = tasksStore.subscribe((tasks: Task[]) => {
            this.renderTasks(container, tasks);
            if (tasks.length != 0 && unsubscriber) {
                unsubscriber();
                unsubscriber = undefined;
            }
        });
        return container;
    }

    private renderTasks(container: HTMLDivElement, tasks: Task[]) {
        const taskWidgetInner = new TaskWidgetInner({
            target: container,
            props: {
                tasks,
            },
        });
        taskWidgetInners.push(taskWidgetInner);
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

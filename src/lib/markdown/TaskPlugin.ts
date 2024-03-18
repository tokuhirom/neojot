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
import { addDays, format, isEqual } from 'date-fns';

export type DateTasks = {
    date: string;
    tasks: Task[];
};

class TaskWidget extends WidgetType {
    private inner: TaskWidgetInner | undefined = undefined;

    constructor() {
        super();
    }

    toDOM() {
        const container = document.createElement('div');
        container.className = 'task-widget';
        tasksStore.subscribe((tasks: Task[]) => {
            const filteredTasks: Record<string, Task[]> = this.filter(tasks);
            console.log(filteredTasks);

            const doing = filteredTasks['DOING'] || [];
            const dateTasks: DateTasks[] = [];
            for (const dt of Object.keys(filteredTasks)) {
                if (dt !== 'DOING') {
                    const tasks = filteredTasks[dt];
                    if (tasks && tasks.length > 0) {
                        dateTasks.push({ date: dt, tasks });
                    }
                }
            }

            if (this.inner) {
                this.inner.$$set({ tasks, doing, dateTasks });
            } else {
                this.inner = new TaskWidgetInner({
                    target: container,
                    props: {
                        tasks,
                        doing,
                        dateTasks,
                    },
                });
            }
        });
        return container;
    }

    private filter(tasks: Task[]): Record<string, Task[]> {
        const result: Record<string, Task[]> = {};
        const start = new Date();
        const end = addDays(new Date(), 7);

        function insert(d: Date | null, task: Task) {
            if (d && start <= d && d <= end) {
                const date = format(d, 'yyyy-MM-dd(EEE)');
                result[date] = [...(result[date] || []), task];
            }
        }

        tasks.forEach((task) => {
            switch (task.type) {
                case 'DOING':
                    result['DOING'] = [...(result['DOING'] || []), task];
                    break;

                case 'PLAN':
                    insert(task.scheduled, task);
                    break;

                case 'NOTE':
                case 'TODO':
                    insert(task.scheduled, task);
                    if (
                        task.scheduled == null ||
                        task.deadline == null ||
                        !isEqual(task.scheduled, task.deadline)
                    ) {
                        console.log(task.scheduled, task.deadline);
                        insert(task.deadline, task);
                    }
                    break;

                case 'WAITING':
                    insert(task.deadline, task);
                    break;

                case 'DONE': // ignore completed tasks
                case 'CANCELED':
                    break;
            }
        });
        return result;
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

import {
    Decoration,
    type EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import {
    calculateFreshness,
    extractTasks,
    getTaskIcon,
    sortTasks,
    type Task,
} from '../task/Task';
import type { FileItem } from '../file_item/FileItem';

class TaskWidget extends WidgetType {
    constructor(private dataFileItems: FileItem[]) {
        super();
    }

    toDOM() {
        const today = new Date();
        const tasks = sortTasks(extractTasks(this.dataFileItems)).filter(
            (task) => {
                return calculateFreshness(task, today) >= 0;
            },
        );
        console.log(tasks);

        const container = document.createElement('div');
        container.className = 'task-widget';
        for (let task of tasks) {
            this.buildTaskElement(container, task);
        }
        // container.textContent = 'Tasks Placeholder';
        return container;
    }

    private buildTaskElement(container: HTMLDivElement, task: Task) {
        const div = document.createElement('div');
        div.innerText = getTaskIcon(task) + ' ' + task.title;
        container.appendChild(div);
    }
}

export function taskPlugin(dataFileItems: FileItem[]) {
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
                        const pos = from + match.index + match[0].length;
                        builder.add(
                            pos,
                            pos,
                            Decoration.widget({
                                widget: new TaskWidget(dataFileItems),
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

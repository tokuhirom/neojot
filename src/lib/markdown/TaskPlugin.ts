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
    constructor(
        private dataFileItems: FileItem[],
        private openTask: (task: Task) => void,
    ) {
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
        div.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();

            // open task
            console.log(
                `open task: ${task.title} ${task.lineNumber} ${task.fileItem.filename}`,
            );
            this.openTask(task);
        });
        container.appendChild(div);
    }
}

export function taskPlugin(
    dataFileItems: FileItem[],
    openTask: (task: Task) => void,
) {
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
                                widget: new TaskWidget(dataFileItems, openTask),
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

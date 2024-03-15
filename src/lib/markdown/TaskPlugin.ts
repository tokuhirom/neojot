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
import { listen } from '@tauri-apps/api/event';
import TaskWidgetInner from './TaskWidgetInner.svelte';

let needsRendering = true;
const taskWidgetInners: TaskWidgetInner[] = [];
let globalGetDataFileItems: () => FileItem[];

function debounce(
    func: (fileItem: FileItem) => void,
    delay: number,
): (fileItem: FileItem) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return function (fileitem: FileItem): void {
        clearTimeout(timeoutId as ReturnType<typeof setTimeout>);
        timeoutId = setTimeout(() => {
            func(fileitem);
        }, delay);
    };
}

const debouncedUpdateTask = debounce((fileItem: FileItem) => {
    if (taskWidgetInners.length > 0) {
        if (fileItem.content.match(/[A-Z]\[.+]/) || needsRendering) {
            needsRendering = false;
            console.log(
                `TaskPlugin: sort_file_list event received: ${taskWidgetInners.length}`,
            );
            const dataFileItems = globalGetDataFileItems();
            taskWidgetInners.forEach((taskWidgetInner) => {
                taskWidgetInner.$$set({
                    dataFileItems,
                });
            });
        }
    }
}, 1000);

listen('sort_file_list', (event) => {
    const payload = event.payload as { fileItem: FileItem };
    const fileItem = payload.fileItem;
    debouncedUpdateTask(fileItem);
});

class TaskWidget extends WidgetType {
    constructor(
        private getDataFileItems: () => FileItem[],
        private openTask: (task: Task) => void,
    ) {
        super();
        globalGetDataFileItems = getDataFileItems;
    }

    toDOM() {
        const container = document.createElement('div');
        container.className = 'task-widget';
        const dataFileItems = this.getDataFileItems();
        this.renderTasks(container, dataFileItems);
        if (dataFileItems.length == 0) {
            setTimeout(() => {
                this.renderTasks(container, this.getDataFileItems());
            }, 1000);
        }
        needsRendering = dataFileItems.length == 0;
        return container;
    }

    private renderTasks(container: HTMLDivElement, dataFileItems: FileItem[]) {
        const taskWidgetInner = new TaskWidgetInner({
            target: container,
            props: {
                dataFileItems,
                onClick: (task: Task) => {
                    this.openTask(task);
                },
            },
        });
        taskWidgetInners.push(taskWidgetInner);
    }
}

export function taskPlugin(
    getDataFileItems: () => FileItem[],
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
                                widget: new TaskWidget(
                                    getDataFileItems,
                                    openTask,
                                ),
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

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
import { debounce } from '../utils/Debounce';

class TaskWidget extends WidgetType {
    private needsRendering: boolean = true;
    private taskWidgetInner: TaskWidgetInner | undefined;

    constructor(
        private getDataFileItems: () => FileItem[],
        private openTask: (task: Task) => void,
    ) {
        super();

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
            console.log('TaskPlugin: sort_file_list event received');
            if (this.taskWidgetInner) {
                if (
                    fileItem.content.match(/[A-Z]\[.+]/) ||
                    this.needsRendering
                ) {
                    this.taskWidgetInner.$$set({
                        dataFileItems: this.getDataFileItems(),
                    });
                    this.needsRendering = false;
                }
            }
        }, 500);

        listen('sort_file_list', (event) => {
            const payload = event.payload as { fileItem: FileItem };
            const fileItem = payload.fileItem;
            debouncedUpdateTask(fileItem);
        });
    }

    toDOM() {
        const container = document.createElement('div');
        container.className = 'task-widget';
        const dataFileItems = this.getDataFileItems();
        this.renderTasks(container, dataFileItems);
        this.needsRendering = dataFileItems.length == 0;
        return container;
    }

    private renderTasks(container: HTMLDivElement, dataFileItems: FileItem[]) {
        this.taskWidgetInner = new TaskWidgetInner({
            target: container,
            props: {
                dataFileItems,
                onClick: (task: Task) => {
                    this.openTask(task);
                },
            },
        });
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

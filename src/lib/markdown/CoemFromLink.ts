import {
    Decoration,
    type EditorView,
    ViewPlugin,
    ViewUpdate,
} from '@codemirror/view';
import { type RangeSet, RangeSetBuilder } from '@codemirror/state';
import type { FileItem } from '../file_item/FileItem';

// カスタムプラグインの型定義
class ComeFromLinkPlugin {
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
        const regex = /^<<<\s+(.+)$/gm; // ここでの正規表現は必要に応じて調整してください
        for (const { from, to } of view.visibleRanges) {
            const text = view.state.doc.sliceString(from, to);
            let match;
            while ((match = regex.exec(text))) {
                const start = from + match.index;
                const end = start + match[0].length;
                const linkDecoration = Decoration.mark({
                    class: 'custom-link',
                    attributes: {
                        'data-keyword': match[1],
                    },
                });
                builder.add(start, end, linkDecoration);
            }
        }
        return builder.finish();
    }
}

export const comeFromLinkPlugin = function (
    searchItem: (keyword: string) => void,
) {
    return ViewPlugin.fromClass(ComeFromLinkPlugin, {
        decorations: (v) => v.decorations,

        eventHandlers: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            mousedown: (event: MouseEvent, _view: EditorView) => {
                const target = event.target as HTMLElement;
                if (target.matches('.custom-link')) {
                    // ここでリンクのクリックイベントを処理
                    console.log(`come-from link clicked! ${target.innerText}`);

                    const keyword = target.getAttribute('data-keyword');
                    if (keyword) {
                        searchItem(keyword);
                    }
                }
            },
        },
    });
};

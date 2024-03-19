import {
    Decoration,
    type EditorView,
    ViewPlugin,
    ViewUpdate,
} from '@codemirror/view';
import { type RangeSet, RangeSetBuilder } from '@codemirror/state';
import { searchKeywordStore } from '../../Stores';

// カスタムプラグインの型定義
class AliasPlugin {
    decorations: RangeSet<Decoration>;

    constructor(view: EditorView) {
        this.decorations = this.computeDecorations(view);
    }

    update(update: ViewUpdate) {
        if (update.docChanged) {
            this.decorations = this.computeDecorations(update.view);
        }
    }

    computeDecorations(view: EditorView): RangeSet<Decoration> {
        const builder = new RangeSetBuilder<Decoration>();
        const regex = /^(ALIAS|AUTOLINK):\s+(.+)$/gm;
        for (const { from, to } of view.visibleRanges) {
            const text = view.state.doc.sliceString(from, to);
            let match;
            while ((match = regex.exec(text))) {
                const start = from + match.index;
                const end = start + match[0].length;
                const linkDecoration = Decoration.mark({
                    class: 'keyword-plugin-' + match[1].toLowerCase(),
                    attributes: {
                        'data-keyword': match[2],
                    },
                });
                builder.add(start, end, linkDecoration);
            }
        }
        return builder.finish();
    }
}

export const aliasPlugin = function () {
    return ViewPlugin.fromClass(AliasPlugin, {
        decorations: (v) => v.decorations,

        eventHandlers: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            mousedown: (event: MouseEvent, _view: EditorView) => {
                const target = event.target as HTMLElement;
                if (
                    target.matches('.keyword-plugin-alias') ||
                    target.matches('.keyword-plugin-autolink')
                ) {
                    // ここでリンクのクリックイベントを処理
                    console.log(`link clicked! ${target.innerText}`);

                    const keyword = target.getAttribute('data-keyword');
                    if (keyword) {
                        searchKeywordStore.set(keyword);
                    }
                }
            },
        },
    });
};

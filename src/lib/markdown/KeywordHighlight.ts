import {
    type Extension,
    type RangeSet,
    RangeSetBuilder,
} from '@codemirror/state';
import {
    Decoration,
    type EditorView,
    ViewPlugin,
    ViewUpdate,
} from '@codemirror/view';

// キーワードハイライト用のデコレーションスタイル
const keywordDecoration = Decoration.mark({ class: 'highlight-keyword' });

export function buildKeywordRegex(keywords: string[]): RegExp {
    // キーワードをエスケープし、| で結合
    const escapedKeywords = keywords.map((kw) =>
        kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'),
    );
    // 英数字と特定の非英数字文字の間、または文字列の開始/終了にマッチするようにする
    const boundary = '(?<![[/\\w.-])';
    const endBoundary = '(?![/\\w.-])';
    return new RegExp(
        `${boundary}(${escapedKeywords.join('|')})${endBoundary}`,
        'gi',
    );
}

// キーワードハイライトプラグインのファクトリ関数
export function autoLinkHighlightPlugin(
    getKeywords: () => string[],
    findOrCreateEntry: (pageName: string) => void,
): Extension {
    return ViewPlugin.fromClass(
        class {
            decorations: RangeSet<Decoration>;

            constructor(view: EditorView) {
                this.decorations = this.computeDecorations(view, getKeywords);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet) {
                    // TODO: needs debounce?
                    this.decorations = this.computeDecorations(
                        update.view,
                        getKeywords,
                    );
                }
            }

            computeDecorations(
                view: EditorView,
                getKeywords: () => string[],
            ): RangeSet<Decoration> {
                console.log('KeywordHighlight.computeDecorations');
                const t1 = Date.now();
                const builder = new RangeSetBuilder<Decoration>();
                const keywords = getKeywords();
                if (keywords.length == 0) {
                    return builder.finish();
                }
                console.log(
                    `KeywordHighlight.computeDecorations: ${keywords.length}`,
                );
                const keywordRegex = buildKeywordRegex(keywords);
                for (const { from, to } of view.visibleRanges) {
                    const text = view.state.doc.sliceString(from, to);
                    let match;
                    while ((match = keywordRegex.exec(text))) {
                        const start = from + match.index;
                        const end = start + match[0].length;
                        builder.add(start, end, keywordDecoration);
                    }
                }
                console.log(`computeDecorations: ${Date.now() - t1}ms`);
                return builder.finish();
            }
        },
        {
            decorations: (v) => v.decorations,
            eventHandlers: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                click: (event, _view) => {
                    const { target } = event;
                    if (
                        target instanceof HTMLElement &&
                        target.matches('.highlight-keyword')
                    ) {
                        const keyword = target.textContent;
                        // ここでキーワードに応じたアクションを実行
                        console.log(`Keyword clicked: ${keyword}`);
                        if (keyword) {
                            findOrCreateEntry(keyword);
                        }
                    }
                },
            },
        },
    );
}

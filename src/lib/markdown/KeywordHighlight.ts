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

function buildKeywordRegex(keywords: string[]): RegExp {
    // キーワードをエスケープし、| で結合
    const escapedKeywords = keywords.map((kw) =>
        kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'),
    );
    return new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'gi');
}

// キーワードハイライトプラグインのファクトリ関数
export function comeFromLinkHighlightPlugin(
    keywords: string[],
    findOrCreateEntry: (pageName: string) => void,
): Extension {
    return ViewPlugin.fromClass(
        class {
            decorations: RangeSet<Decoration>;

            constructor(view: EditorView) {
                this.decorations = this.computeDecorations(view, keywords);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet) {
                    this.decorations = this.computeDecorations(
                        update.view,
                        keywords,
                    );
                }
            }

            computeDecorations(
                view: EditorView,
                keywords: string[],
            ): RangeSet<Decoration> {
                const builder = new RangeSetBuilder<Decoration>();
                for (const { from, to } of view.visibleRanges) {
                    const text = view.state.doc.sliceString(from, to);
                    const keywordRegex = buildKeywordRegex(keywords);
                    let match;
                    while ((match = keywordRegex.exec(text))) {
                        const start = from + match.index;
                        const end = start + match[0].length;
                        builder.add(start, end, keywordDecoration);
                    }
                }
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

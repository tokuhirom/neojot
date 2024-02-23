import { Decoration, EditorView } from '@codemirror/view';
import { WidgetType, ViewUpdate, ViewPlugin } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false });

class MermaidWidget extends WidgetType {
    constructor(readonly content: string) {
        super();
    }

    toDOM() {
        const container = document.createElement('div');
        container.className = 'mermaid';
        container.style.backgroundColor = '#f0ead6';
        container.style.padding = '10px'; // コンテンツとの間に少し余白を設ける
        container.style.borderRadius = '4px'; // 角を少し丸める
        container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; // 軽い影を追加する

        mermaid
            .render(
                'mermaidGraph-' + Math.floor(Math.random() * 10000),
                this.content,
                container,
            )
            .then((renderingResult) => {
                container.innerHTML = renderingResult.svg;
            });
        return container;
    }

    ignoreEvent() {
        return false;
    }
}

export function mermaidPlugin() {
    return ViewPlugin.fromClass(
        class {
            decorations: Decoration.Set;

            constructor(view: EditorView) {
                this.decorations = this.findMermaidBlocks(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = this.findMermaidBlocks(update.view);
                }
            }

            findMermaidBlocks(view: EditorView) {
                const builder = new RangeSetBuilder<Decoration>();
                for (let { from, to } of view.visibleRanges) {
                    const text = view.state.doc.sliceString(from, to);
                    const regex = /```mermaid([^`]*?)```/g;
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const start = from + match.index;
                        const end = start + match[0].length;
                        const content = match[1].trim();
                        if (content) {
                            const widget = new MermaidWidget(content);
                            builder.add(
                                end,
                                end,
                                Decoration.widget({ widget, side: 1 }),
                            );
                        }
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

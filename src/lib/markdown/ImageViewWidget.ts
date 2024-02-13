import {
    Decoration,
    type EditorView,
    ViewPlugin,
    type ViewUpdate,
    WidgetType,
} from '@codemirror/view'
import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs'
import {
    type RangeSet,
    RangeSetBuilder,
    type RangeValue,
} from '@codemirror/state'

export function uint8ArrayToDataUrl(
    uint8Array: Uint8Array,
    mediaType = 'image/png',
): Promise<string> {
    return new Promise((resolve, reject) => {
        const blob = new Blob([uint8Array], { type: mediaType })
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result
            resolve(base64String as string)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

class ImageViewWidget extends WidgetType {
    constructor(readonly src: string) {
        super()
    }

    toDOM() {
        const img = document.createElement('img')

        if (this.src.startsWith('../')) {
            console.log('Loading image source')
            readFile(this.src.replace('../', ''), {
                baseDir: BaseDirectory.AppData,
            }).then((value) => {
                console.log('then!!')
                uint8ArrayToDataUrl(value).then((it) => {
                    img.src = it
                })
            })
        } else {
            img.src = this.src
        }
        img.alt = this.src
        img.style.maxWidth = '100%'

        const wrapper = document.createElement('div')
        wrapper.appendChild(img)
        return wrapper
    }

    eq(other: ImageViewWidget) {
        // ソースが同じであれば、trueを返して再生成をスキップ
        return this.src === other.src
    }

    ignoreEvent() {
        return false
    }
}

export const imageDecorator: ViewPlugin<{
    decorations: RangeSet<RangeValue>
    update(update: ViewUpdate): void
    buildDecorations(view: EditorView): RangeSet<RangeValue>
}> = ViewPlugin.fromClass(
    class {
        decorations: RangeSet<RangeValue>

        constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view)
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = this.buildDecorations(update.view)
            }
        }

        buildDecorations(view: EditorView): RangeSet<RangeValue> {
            const builder = new RangeSetBuilder()
            const re = /!\[.*?]\((.*?)\)/g
            for (const { from, to } of view.visibleRanges) {
                const text = view.state.doc.sliceString(from, to)
                let match
                while ((match = re.exec(text))) {
                    const imgSrc = match[1]
                    const widget = new ImageViewWidget(imgSrc)
                    const pos = from + match.index + match[0].length
                    builder.add(
                        pos,
                        pos,
                        Decoration.widget({ widget, side: 1 }),
                    )
                }
            }
            return builder.finish()
        }
    },
    {
        decorations: (v) => v.decorations,
    },
)

<script lang="ts">

    import {createNewFileWithContent, readAndSaveImage, saveMarkdownFile} from "./repository/NodeRepository";
    import {onMount} from "svelte";
    import {defaultKeymap, indentLess, indentMore} from "@codemirror/commands";
    import {markdown, markdownLanguage} from "@codemirror/lang-markdown";
    import {EditorState, RangeSetBuilder, Transaction} from "@codemirror/state";
    import {Decoration, EditorView, keymap, ViewPlugin, WidgetType} from "@codemirror/view";
    import {extractTitle, type FileItem} from "./FileItem";
    import {emit} from "@tauri-apps/api/event";
    import {oneDark, oneDarkHighlightStyle} from "@codemirror/theme-one-dark";
    import {LanguageDescription, syntaxHighlighting} from "@codemirror/language";
    import {autocompletion, type CompletionContext} from "@codemirror/autocomplete";
    import {javascript} from "@codemirror/lang-javascript";
    import {python} from "@codemirror/lang-python";
    import {java} from "@codemirror/lang-java";
    import {invoke} from "@tauri-apps/api/core";
    import {BaseDirectory, readFile} from "@tauri-apps/plugin-fs";

    export let file: FileItem;
export let fileItems: FileItem[];
export let openEntry: (fileItem: FileItem) => void;

let myElement;

function uint8ArrayToDataUrl(uint8Array: Uint8Array, mediaType = 'image/png'): Promise<string> {
    return new Promise((resolve, reject) => {
        const blob = new Blob([uint8Array], {type: mediaType});
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            resolve(base64String as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

class ImageViewWidget extends WidgetType {
    constructor(readonly src) {
        super();
    }

    toDOM() {
        const img = document.createElement('img');

        if (this.src.startsWith("../")) {
            console.log("Loading image source");
            readFile(this.src.replace('../', ''), {baseDir: BaseDirectory.AppData})
                .then(
                    value => {
                        console.log("then!!")
                        uint8ArrayToDataUrl(value).then(it => {
                            img.src = it
                        });
                    }
                );
        } else {
            img.src = this.src;
        }
        img.alt = this.src;
        img.style.maxWidth = '100%';

        const wrapper = document.createElement('div');
        wrapper.appendChild(img);
        return wrapper;
    }

    eq(other: ImageViewWidget) {
        // ソースが同じであれば、trueを返して再生成をスキップ
        return this.src === other.src;
    }

    ignoreEvent() {
        return false;
    }
}

const imageDecorator = ViewPlugin.fromClass(class {
    decorations;

    constructor(view) {
        this.decorations = this.buildDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view) {
        const builder = new RangeSetBuilder();
        const re = /!\[.*?]\((.*?)\)/g;
        for (let {from, to} of view.visibleRanges) {
            const text = view.state.doc.sliceString(from, to);
            let match;
            while ((match = re.exec(text))) {
                const imgSrc = match[1];
                const widget = new ImageViewWidget(imgSrc);
                const pos = from + match.index + match[0].length;
                builder.add(pos, pos, Decoration.widget({widget, side: 1}));
            }
        }
        return builder.finish();
    }
}, {
    decorations: v => v.decorations
});



async function save() {
    console.log(`SAVING: ${file.filename}`);
    let state = view.state;
    let doc = state.doc;
    let text = doc.toString();
    file.content = text;
    const newTitle = extractTitle(text);
    if (file.title !== newTitle) {
        file.title = newTitle;
        await emit("change_title", {filename: file.filename});
    }
    await saveMarkdownFile(file.filename, text);
    file.mtime = Math.floor(Date.now() / 1000);
    await emit("sort_file_list");
}

let view: EditorView;

onMount(() => {
    let container = myElement;


    const codeLangauages = [
        LanguageDescription.of({
            name: "javascript",
            support: javascript(),
        }),
        LanguageDescription.of({
            name: "python",
            support: python(),
        }),
        LanguageDescription.of({
            name: "java",
            support: java(),
        }),
        LanguageDescription.of({
            name: "json",
            support: javascript(),
        }),
        LanguageDescription.of({
            name: "typescript",
            support: javascript({typescript: true}),
        }),
    ];

    const myCompletion = (context: CompletionContext) => {
        {
            // `[[foobar]]` style notation
            const word = context.matchBefore(/\[\[\w*/);
            if (word) {
                console.log("Return links")
                const options = fileItems.map(fileItem => {
                    return {label: `[[${fileItem.title}]]`, type: 'keyword'};
                });
                return {
                    from: word.from,
                    options: options,
                };
            }
        }
        {
            // Code block's language completion
            // ```typescript auto completion
            const word = context.matchBefore(/```\w*/);
            if (word) {
                return {
                    from: word.from,
                    // can I get the list from EditorView or something?
                    options: [...(codeLangauages.map(lang => {
                        return {
                            label: "```" + lang.name, type: 'keyword'
                        }
                    })), {label: '```', type: 'keyword'}]
                }
            }
        }
        return null;
    };

    async function openInternalLink(view: EditorView) {
        const { from, to } = view.state.selection.main;
        if (from === to) { // カーソル位置のみをチェック
            const line = view.state.doc.lineAt(from);
            const lineText = line.text;
            const lineOffset = from - line.from; // 行内オフセットを計算

            // カーソル位置から内部リンクを探す
            const linkRegex = /\[\[.*?]]/g;
            let match: RegExpExecArray | null;
            while ((match = linkRegex.exec(lineText)) !== null) {
                if (match.index <= lineOffset && match.index + match[0].length >= lineOffset) {
                    const pageName = match[0].slice(2, -2); // リンク名の取得

                    for (let fileItem of fileItems) {
                        if (fileItem.title == pageName) {
                            openEntry(fileItem);
                            return true;
                        }
                    }

                    // create new entry
                    const fileItem = await createNewFileWithContent(`# ${pageName}`);
                    fileItems.unshift(fileItem);
                    openEntry(fileItem);
                    return true;
                }
            }
        }
        return false;
    }

    const customKeymap = [
        {
            key: "Mod-b",
            run: openInternalLink,
        },
        {
            key: "Tab",
            preventDefault: true,
            run: indentMore,
        },
        {
            key: "Shift-Tab",
            preventDefault: true,
            run: indentLess,
        },
        ...defaultKeymap // 標準のキーマップを含める
    ];

    const handlePaste = async (event) => {
        let handled = false;

        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf("image") === 0) {
                handled = true;

                const blob = item.getAsFile();
                // Now you can handle the image file (blob)
                const pathFromAppDir = await readAndSaveImage(blob);
                const path = `../${pathFromAppDir}`;

                const markdownImageText = `![image](${path})\n`;
                const transaction = view.state.update({
                    changes: {from: view.state.selection.main.from, insert: markdownImageText}
                });
                view.dispatch(transaction);
            }
        }

        if (handled) {
            event.preventDefault();
            return true;
        } else {
            const text = (event.clipboardData || event.originalEvent.clipboardData).getData('text');
            if (text) {
                const transaction = view.state.update({
                    changes: {from: view.state.selection.main.from, insert: text}
                });
                view.dispatch(transaction);
                event.preventDefault();
                return true;
            }
            return false;
        }
    };

    let startState = EditorState.create({
        doc: file.content,
        extensions: [
            imageDecorator,
            EditorView.domEventHandlers({paste: handlePaste}),
            keymap.of(customKeymap),
            markdown({
                base: markdownLanguage, // enable github flavored markdown
                codeLanguages: codeLangauages,
            }),
            autocompletion({ override: [myCompletion] }),
            oneDark,
            syntaxHighlighting(oneDarkHighlightStyle),
            EditorView.lineWrapping,
            EditorView.updateListener.of(async update => {
                if (update.changes) {
                    let isUserInput = update.transactions.some(tr => tr.annotation(Transaction.userEvent) !== "program");
                    if (isUserInput) {
                        console.log(`テキストが変更されました ${isUserInput}`);
                        await save();
                    }
                }
            })
        ]
    })

    view = new EditorView({
        state: startState,
        parent: container
    })

    view.dom.addEventListener("click", async (event) => {
        const target = event.target;

        if (target instanceof HTMLSpanElement) {
            const url = target.innerHTML;
            if (url.match(/^https?:\/\//)) {
                console.log(`opening url: ${url}`)
                await invoke("open_url", {url});
                event.preventDefault();
            }
        }
    });
});

let prevFileName = "";

$: if (file) {
    if (view) {
        if (prevFileName !== file.filename) {
            console.log(`Loading entry: ${file.filename}`)

            let state = view.state;
            let transaction = state.update({
                changes: {from: 0, to: state.doc.length, insert: file.content},
                annotations: Transaction.userEvent.of("program")
            });
            view.dispatch(transaction);

            if (file.content === "# ") {
                // カーソルをドキュメントの末尾に移動
                let state = view.state;
                let endPos = state.doc.length;
                let moveCursor = state.update({
                    selection: {anchor: endPos, head: endPos}
                });
                view.dispatch(moveCursor);
            }

            prevFileName = file.filename;
        }
    }
}


</script>

<div bind:this={myElement}>
</div>

<style>
</style>

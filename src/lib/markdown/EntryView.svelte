<script lang="ts">
    import {
        createNewFileWithContent,
        readAndSaveImage,
        saveMarkdownFile,
    } from '../repository/NodeRepository';
    import { onMount } from 'svelte';
    import {
        defaultKeymap,
        indentLess,
        indentMore,
    } from '@codemirror/commands';
    import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
    import { EditorState, Transaction } from '@codemirror/state';
    import { EditorView, type KeyBinding, keymap } from '@codemirror/view';
    import { extractTitle, type FileItem } from '../file_item/FileItem';
    import { emit } from '@tauri-apps/api/event';
    import { oneDark, oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
    import {
        LanguageDescription,
        syntaxHighlighting,
    } from '@codemirror/language';
    import {
        autocompletion,
        type CompletionContext,
    } from '@codemirror/autocomplete';
    import { javascript } from '@codemirror/lang-javascript';
    import { python } from '@codemirror/lang-python';
    import { java } from '@codemirror/lang-java';
    import { invoke } from '@tauri-apps/api/core';
    import { cpp } from '@codemirror/lang-cpp';
    import { css } from '@codemirror/lang-css';
    import { html } from '@codemirror/lang-html';
    import { php } from '@codemirror/lang-php';
    import { sql } from '@codemirror/lang-sql';
    import { xml } from '@codemirror/lang-xml';
    import { yaml } from '@codemirror/lang-yaml';
    import { internalLinkDecorator } from './InternalWikiLink';
    import { imageDecorator } from './ImageViewWidget';

    export let file: FileItem;
    export let allFileItems: FileItem[];
    export let onSelectItem: (fileItem: FileItem) => void;
    export let onCreateItem: (fileItem: FileItem) => void;
    export let onSaved: () => void;

    let myElement;

    async function save() {
        console.log(`SAVING: ${file.filename}`);
        let state = view.state;
        let doc = state.doc;
        let text = doc.toString();
        if (file.content !== text) {
            file.content = text;

            const newTitle = extractTitle(text);
            if (file.title !== newTitle) {
                file.title = newTitle;
                await emit('change_title', { filename: file.filename });
            }
            await saveMarkdownFile(file.filename, text);
            file.mtime = Math.floor(Date.now() / 1000);
            await emit('sort_file_list');
            onSaved();
        }
    }

    let view: EditorView;

    onMount(() => {
        let container = myElement;

        const codeLangauages = [
            LanguageDescription.of({
                name: 'javascript',
                support: javascript(),
            }),
            LanguageDescription.of({
                name: 'python',
                support: python(),
            }),
            LanguageDescription.of({
                name: 'java',
                support: java(),
            }),
            LanguageDescription.of({
                name: 'json',
                support: javascript(),
            }),
            LanguageDescription.of({
                name: 'typescript',
                support: javascript({ typescript: true }),
            }),
            LanguageDescription.of({
                name: 'cpp',
                support: cpp(),
            }),
            LanguageDescription.of({
                name: 'css',
                support: css(),
            }),
            LanguageDescription.of({
                name: 'html',
                support: html(),
            }),
            LanguageDescription.of({
                name: 'php',
                support: php(),
            }),
            LanguageDescription.of({
                name: 'sql',
                support: sql(),
            }),
            LanguageDescription.of({
                name: 'xml',
                support: xml(),
            }),
            LanguageDescription.of({
                name: 'yaml',
                support: yaml(),
            }),
        ];

        const myCompletion = (context: CompletionContext) => {
            {
                // `[[foobar]]` style notation
                const word = context.matchBefore(/\[\[\w*/);
                if (word) {
                    console.log('Return links');
                    const options = allFileItems.map((fileItem) => {
                        return {
                            label: `[[${fileItem.title}]]`,
                            type: 'keyword',
                        };
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
                        options: [
                            ...codeLangauages.map((lang) => {
                                return {
                                    label: '```' + lang.name,
                                    type: 'keyword',
                                };
                            }),
                            { label: '```', type: 'keyword' },
                        ],
                    };
                }
            }
            return null;
        };

        function findOrCreateEntry(pageName: string) {
            for (let fileItem of allFileItems) {
                if (fileItem.title === pageName) {
                    onSelectItem(fileItem);
                    return;
                }
            }

            // create new entry
            console.log(
                `Page '${pageName}' is not found. Trying to create new entry...${allFileItems.length}`,
            );
            createNewFileWithContent(`# ${pageName}\n\n`).then(
                (fileItem: FileItem) => {
                    onCreateItem(fileItem);
                },
            );
        }

        function openInternalLink(view: EditorView) {
            const { from, to } = view.state.selection.main;
            if (from === to) {
                // カーソル位置のみをチェック
                const line = view.state.doc.lineAt(from);
                const lineText = line.text;
                const lineOffset = from - line.from; // 行内オフセットを計算

                // カーソル位置から内部リンクを探す
                const linkRegex = /\[\[.*?]]/g;
                let match: RegExpExecArray | null;
                while ((match = linkRegex.exec(lineText)) !== null) {
                    if (
                        match.index <= lineOffset &&
                        match.index + match[0].length >= lineOffset
                    ) {
                        const pageName = match[0].slice(2, -2); // リンク名の取得
                        findOrCreateEntry(pageName);
                        return true;
                    }
                }
            }
            return false;
        }

        function formatDate(date) {
            let d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;

            return '[' + [year, month, day].join('-') + ']! ';
        }

        function insertDateCommand(view) {
            const dateStr = formatDate(new Date()); // 現在の日付を取得
            const from = view.state.selection.main.from;
            const to = from + dateStr.length;

            view.dispatch({
                changes: { from: from, insert: dateStr },
                selection: { anchor: to },
            });
            return true;
        }

        const customKeymap: KeyBinding[] = [
            {
                key: 'Mod-b',
                run: openInternalLink,
            },
            { key: 'Mod-t', run: insertDateCommand },
            {
                key: 'Tab',
                preventDefault: true,
                run: indentMore,
            },
            {
                key: 'Shift-Tab',
                preventDefault: true,
                run: indentLess,
            },
            ...defaultKeymap, // 標準のキーマップを含める
        ];

        const handlePaste = (event) => {
            let handled = false;

            const items = (
                event.clipboardData || event.originalEvent.clipboardData
            ).items;
            for (const item of items) {
                if (item.type.indexOf('image') === 0) {
                    handled = true;

                    const blob = item.getAsFile();
                    // Now you can handle the image file (blob)
                    readAndSaveImage(blob).then((pathFromAppDir) => {
                        const path = `../${pathFromAppDir}`;

                        const markdownImageText = `![image](${path})\n`;
                        const transaction = view.state.update({
                            changes: {
                                from: view.state.selection.main.from,
                                insert: markdownImageText,
                            },
                        });
                        view.dispatch(transaction);
                    });
                }
            }

            if (handled) {
                event.preventDefault();
                return true;
            } else {
                const text = (
                    event.clipboardData || event.originalEvent.clipboardData
                ).getData('text');
                if (text) {
                    const transaction = view.state.update({
                        changes: {
                            from: view.state.selection.main.from,
                            insert: text,
                        },
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
                internalLinkDecorator,
                imageDecorator,
                EditorView.domEventHandlers({ paste: handlePaste }),
                keymap.of(customKeymap),
                markdown({
                    base: markdownLanguage, // enable github flavored markdown
                    codeLanguages: codeLangauages,
                }),
                autocompletion({ override: [myCompletion] }),
                oneDark,
                syntaxHighlighting(oneDarkHighlightStyle),
                EditorView.lineWrapping,
                EditorView.updateListener.of(async (update) => {
                    if (update.changes) {
                        let isUserInput = update.transactions.some(
                            (tr) =>
                                tr.annotation(Transaction.userEvent) !==
                                    'program' && tr.docChanged,
                        );
                        if (isUserInput) {
                            console.log(
                                `テキストが変更されました ${isUserInput}`,
                            );
                            await save();
                        }
                    }
                }),
                EditorView.domEventHandlers({
                    click: (event) => {
                        const { target } = event;
                        if (
                            target instanceof HTMLElement &&
                            target.closest('.internal-link')
                        ) {
                            console.log(
                                `Internal link clicked: ${target.innerText}`,
                            );

                            event.preventDefault();
                            findOrCreateEntry(target.innerText);
                        }
                    },
                }),
            ],
        });

        view = new EditorView({
            state: startState,
            parent: container,
        });

        view.dom.addEventListener('click', async (event) => {
            const target = event.target;

            if (target instanceof HTMLSpanElement) {
                const url = target.innerHTML;
                if (url.match(/^https?:\/\//)) {
                    console.log(`opening url: ${url}`);
                    await invoke('open_url', { url });
                    event.preventDefault();
                }
            }
        });
    });

    let prevFileName = '';

    $: if (file) {
        if (view) {
            if (prevFileName !== file.filename) {
                console.log(
                    `Loading entry: ${file.filename} (previous: ${prevFileName})`,
                );

                let state = view.state;
                let transaction = state.update({
                    changes: {
                        from: 0,
                        to: state.doc.length,
                        insert: file.content,
                    },
                    annotations: Transaction.userEvent.of('program'),
                });
                view.dispatch(transaction);

                if (file.content === '# ') {
                    // カーソルをドキュメントの末尾に移動
                    let state = view.state;
                    let endPos = state.doc.length;
                    let moveCursor = state.update({
                        selection: { anchor: endPos, head: endPos },
                    });
                    view.dispatch(moveCursor);
                }

                prevFileName = file.filename;
            }
        }
    }
</script>

<div class="wrapper">
    <div bind:this={myElement}></div>
</div>

<style>
    .wrapper {
        width: 100%;
    }
</style>

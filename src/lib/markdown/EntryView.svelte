<script lang="ts">
    import {
        createNewFileWithContent,
        readAndSaveImage,
        saveMarkdownFile,
    } from '../repository/NodeRepository';
    import { onDestroy, onMount } from 'svelte';
    import { Transaction } from '@codemirror/state';
    import { EditorView } from '@codemirror/view';
    import { extractTitle, type FileItem } from '../file_item/FileItem';
    import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event';
    import {
        autocompletion,
        type CompletionContext,
    } from '@codemirror/autocomplete';
    import { linkPlugin } from './LinkPlugin';
    import { comeFromLinkHighlightPlugin } from './KeywordHighlight';
    import { languages } from '@codemirror/language-data';
    import BasicCodeMirror6 from './BasicCodeMirror6.svelte';
    import { internalLinkPlugin } from './InternalWikiLink';
    import { oneDark } from '@codemirror/theme-one-dark';
    import { openInternalLink } from './KeyHandler';

    export let file: FileItem;
    export let allFileItems: FileItem[];
    export let onSelectItem: (fileItem: FileItem) => void;
    export let onCreateItem: (fileItem: FileItem) => void;
    export let onSaved: () => void;
    // for completion
    export let title2fileItem: Record<string, FileItem>;
    export let comefromLinks: Record<string, FileItem>;
    export let search: (keyword: string) => void | undefined;
    export let existsEntry: (title: string) => boolean;

    let keymaps = [
        { key: 'Mod-d', run: archive, preventDefault: true },
        {
            key: 'Mod-b',
            run: (view: EditorView) =>
                openInternalLink(view, findOrCreateEntry),
        },
    ];

    async function onUpdateText(text: string) {
        console.log(`SAVING: ${file.filename}`);
        if (file.content !== text) {
            file.content = text;

            const newTitle = extractTitle(text);
            if (file.title !== newTitle) {
                file.title = newTitle;
                await emit('change_title', { filename: file.filename });
            }
            await saveMarkdownFile(file.filename, text);
            file.mtime = Math.floor(Date.now() / 1000);
            console.log(`emit sort_file_list: ${file.filename}`);
            await emit('sort_file_list', { fileItem: file });
            console.log(`onSaved: ${file.filename}`);
            onSaved();
        }
    }

    let view: EditorView;

    const unlistenFunctions: UnlistenFn[] = [];
    onMount(async () => {
        //        emit('go-to-line-number', { lineNumber: parseInt(lineNumber, 10) });
        unlistenFunctions.push(
            await listen('go-to-line-number', (e) => {
                const lineNumber = e.payload as number;
                const line = view.state.doc.line(lineNumber);
                view.dispatch({
                    selection: { anchor: line.from },
                    effects: EditorView.scrollIntoView(line.from, {
                        y: 'center',
                    }),
                });
                view.focus();
            }),
        );
    });
    onDestroy(() => {
        unlistenFunctions.forEach((it) => {
            it();
        });
    });

    const myCompletion = (context: CompletionContext) => {
        {
            // `[[foobar]]` style notation
            const word = context.matchBefore(/\[\[\w*/);
            if (word) {
                console.log('Return links');
                const options = Object.keys(title2fileItem).map((title) => {
                    return {
                        label: `[[${title}]]`,
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
                        ...languages.map((lang) => {
                            return {
                                label: '```' + lang.extensions[0],
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

    // 本来はメニューが反応してarchiveされるべきだが、エディタ上でのMod-dが何者かに横取り
    // されていて処理できないっぽいので、ここで処理する
    function archive() {
        console.log('archive');
        emit('do_archive', { filename: file.filename });
        return true;
    }

    const handlePaste = (event) => {
        let handled = false;

        const items = (event.clipboardData || event.originalEvent.clipboardData)
            .items;
        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                handled = true;

                const blob = item.getAsFile();
                // Now you can handle the image file (blob)
                readAndSaveImage(blob).then((pathFromAppDir) => {
                    const path = `../${pathFromAppDir}`;

                    const markdownImageText = `![[${path}|100]]\n`;
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

    function findOrCreateEntry(pageName: string) {
        const lowerPageName = pageName.toLowerCase();

        for (let title of Object.keys(comefromLinks)) {
            if (title.toLowerCase() === lowerPageName) {
                onSelectItem(comefromLinks[title]);
                if (search) {
                    search(pageName);
                }
                return;
            }
        }

        for (let title of Object.keys(title2fileItem)) {
            if (title.toLowerCase() === lowerPageName) {
                onSelectItem(title2fileItem[title]);
                if (search) {
                    search(pageName);
                }
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
                if (search) {
                    search(pageName);
                }
            },
        );
    }

    let extensions = [
        oneDark,
        internalLinkPlugin(existsEntry, (pageName) => {
            findOrCreateEntry(pageName);
        }),
        linkPlugin((keyword) => {
            search(keyword);
        }),
        comeFromLinkHighlightPlugin(
            () => Object.keys(comefromLinks),
            findOrCreateEntry,
        ),
        EditorView.domEventHandlers({ paste: handlePaste }),
        autocompletion({ override: [myCompletion] }),
    ];

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
    <BasicCodeMirror6
        bind:view
        {extensions}
        initialContent={file.content}
        {onUpdateText}
        {keymaps}
    />
</div>

<style>
    .wrapper {
        width: 100%;
    }
</style>

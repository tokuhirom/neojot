<script lang="ts">
    import {
        createNewFileWithContent,
        readAndSaveImage,
        saveMarkdownFile,
    } from '../repository/NodeRepository';
    import { onDestroy, onMount } from 'svelte';
    import {
        defaultKeymap,
        indentLess,
        indentMore,
        redo,
        undo,
        history,
    } from '@codemirror/commands';
    import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
    import { EditorState, Transaction } from '@codemirror/state';
    import { EditorView, type KeyBinding, keymap } from '@codemirror/view';
    import { extractTitle, type FileItem } from '../file_item/FileItem';
    import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event';
    import { oneDark, oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
    import {
        autocompletion,
        type CompletionContext,
    } from '@codemirror/autocomplete';
    import { invoke } from '@tauri-apps/api/core';
    import { internalLinkDecorator } from './InternalWikiLink';
    import { imageDecorator } from './ImageViewWidget';
    import { openSearchPanel, searchKeymap } from '@codemirror/search';
    import { mermaidPlugin } from './MermaidWidget';
    import { addDays, format, parse } from 'date-fns';
    import { linkPlugin } from './LinkPlugin';
    import { comeFromLinkHighlightPlugin } from './KeywordHighlight';
    import { languages } from '@codemirror/language-data';
    import { syntaxHighlighting } from '@codemirror/language';
    import { todoPlugin } from './TodoWidget';

    export let file: FileItem;
    export let allFileItems: FileItem[];
    export let onSelectItem: (fileItem: FileItem) => void;
    export let onCreateItem: (fileItem: FileItem) => void;
    export let onSaved: () => void;
    export let title2fileItem: Record<string, FileItem>;
    export let comefromLinks: Record<string, FileItem>;
    export let search: (keyword: string) => void | undefined;

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

    onMount(() => {
        let container = myElement;

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

        function openInternalLink(view: EditorView) {
            const { from, to } = view.state.selection.main;
            if (from === to) {
                // カーソル位置のみをチェック
                const line = view.state.doc.lineAt(from);
                const lineText = line.text;
                const lineOffset = from - line.from; // 行内オフセットを計算

                // カーソル位置から内部リンクを探す
                const linkRegex = /\[\[.*?]]|https?:\/\/\S+/g;
                let match: RegExpExecArray | null;
                while ((match = linkRegex.exec(lineText)) !== null) {
                    if (
                        match.index <= lineOffset &&
                        match.index + match[0].length >= lineOffset
                    ) {
                        if (match[0].startsWith('http')) {
                            const url = match[0];
                            console.log(`opening url: ${url}`);
                            invoke('open_url', { url });
                            return true;
                        } else {
                            // 内部リンクの場合はページを開く
                            const pageName = match[0].slice(2, -2); // リンク名の取得
                            findOrCreateEntry(pageName);
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        function insertDateCommand(view, key: string) {
            const dateStr =
                `${key}[Scheduled:` +
                format(new Date(), 'yyyy-MM-dd(EEE)') +
                ']: ';
            const from = view.state.selection.main.from;
            const to = from + dateStr.length;

            view.dispatch({
                changes: { from: from, insert: dateStr },
                selection: { anchor: to },
            });
            return true;
        }

        function updateDate(view: EditorView, increment: boolean): boolean {
            const { state, dispatch } = view;
            const { selection } = state;
            const { from, to } = selection.main;

            if (from !== to) {
                // 選択範囲が空でない場合は何もしない
                return false;
            }

            const line = state.doc.lineAt(from);
            const dateRegex = /(\d{4}-\d{2}-\d{2})\([A-Z][a-z][a-z]\)/g; // グローバル検索に変更
            let match;
            let isCursorOnDate = false;

            // 全ての日付パターンをチェック
            while ((match = dateRegex.exec(line.text)) !== null) {
                const matchStart = line.from + match.index;
                const matchEnd = matchStart + match[0].length;
                if (from >= matchStart && from <= matchEnd) {
                    // カーソルが日付パターンの上にある
                    isCursorOnDate = true;
                    break;
                }
            }

            if (isCursorOnDate && match) {
                // カーソル位置に日付が含まれている場合
                const date = parse(match[1], 'yyyy-MM-dd', new Date());
                const updatedDate = addDays(date, increment ? 1 : -1);
                const formattedDate = format(updatedDate, 'yyyy-MM-dd(EEE)');

                // 日付を更新する
                dispatch(
                    state.update({
                        changes: {
                            from: line.from + match.index,
                            to: line.from + match.index + match[0].length,
                            insert: formattedDate,
                        },
                    }),
                );
                return true;
            }

            return false;
        }

        // エンターキーが押されたときに実行される関数
        function changeTaskState(
            view: EditorView,
            key: string,
            finish: boolean,
        ): boolean {
            const { state, dispatch } = view;

            let { from } = state.selection.main;
            // 現在の行を取得
            const line = state.doc.lineAt(from);
            const lineText = line.text;
            const datePattern =
                /^(?:TODO|DOING|DONE|NOTE)(\[(((Scheduled|Deadline):\d{4}-\d{2}-\d{2}\([A-Z][a-z][a-z]\)\s*)*)])?:/;
            const match = datePattern.exec(lineText);

            if (
                match &&
                from <= line.from + match.index + match[1].length + 1
            ) {
                let replaceFrom = line.from;
                let replaceTo = replaceFrom + match[0].length;

                // 現在の日付を取得
                const currentDate = format(new Date(), 'yyyy-MM-dd(EEE)');
                // 新しい行の内容を準備
                const nextKey =
                    key === 'DOING' && line.text.startsWith('DOING')
                        ? 'TODO'
                        : key === 'NOTE' && line.text.startsWith('NOTE')
                          ? 'TODO'
                          : key;
                const completedTask = `${nextKey}[${finish ? `Finished:${currentDate} ` : ''}${match[2]}]:`;

                // 現在の行の後に新しい行を追加
                dispatch(
                    state.update({
                        changes: {
                            from: replaceFrom,
                            to: replaceTo,
                            insert: completedTask,
                        },
                        userEvent: 'input',
                    }),
                );
                return true;
            }
            return false;
        }

        // エンターキーが押されたときに実行される関数
        function insertTodoDate(view: EditorView, key: string): boolean {
            const { state, dispatch } = view;

            let { from } = state.selection.main;
            const line = state.doc.lineAt(from);
            const lineText = line.text;
            const datePattern =
                /^TODO(\[(((Scheduled|Deadline):\d{4}-\d{2}-\d{2}\([A-Z][a-z][a-z]\)\s*)*)])?:/;
            const match = datePattern.exec(lineText);

            if (
                match &&
                from <= line.from + match.index + match[0].length + 1
            ) {
                if (match[2] && match[2].includes(key)) {
                    // This key is already included in this task.
                    // ignore the key input.
                    return true;
                }
                let replaceFrom = line.from;
                let replaceTo = replaceFrom + match[0].length;

                // 現在の日付を取得
                const currentDate = format(new Date(), 'yyyy-MM-dd(EEE)');
                // 新しい行の内容を準備
                const completedTask = `TODO[${key}:${currentDate}${match[2] ? ' ' + match[2] : ''}]:`;

                // 現在の行の後に新しい行を追加
                dispatch(
                    state.update({
                        changes: {
                            from: replaceFrom,
                            to: replaceTo,
                            insert: completedTask,
                        },
                        userEvent: 'input',
                    }),
                );
                return true;
            }
            return false;
        }

        const customKeymap: KeyBinding[] = [
            { key: 'Mod-z', run: undo, preventDefault: true },
            { key: 'Mod-Shift-z', run: redo, preventDefault: true },
            {
                key: 'Mod-b',
                run: openInternalLink,
            },
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
            { key: 'Mod-f', run: openSearchPanel, preventDefault: true },
            { key: 'Mod-r', run: openSearchPanel, preventDefault: true }, // replace?
            // task related -----------------------------------------
            { key: 'Mod-t', run: (view) => insertDateCommand(view, 'TODO') },
            { key: 'Mod-p', run: (view) => insertDateCommand(view, 'PLAN') },
            {
                key: '+', // Cmd/Ctrl + +
                run: (view) => updateDate(view, true),
            },
            {
                key: '-', // Cmd/Ctrl + -
                run: (view) => updateDate(view, false),
            },
            {
                key: 'Enter',
                run: (view: EditorView) => changeTaskState(view, 'DONE', false),
            },
            {
                key: 'c',
                run: (view: EditorView) =>
                    changeTaskState(view, 'CANCELED', true),
            },
            {
                key: 'd',
                run: (view: EditorView) => insertTodoDate(view, 'Deadline'),
            },
            {
                key: 's',
                run: (view: EditorView) => insertTodoDate(view, 'Scheduled'),
            },
            ...searchKeymap,
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
                history(),
                todoPlugin,
                linkPlugin((keyword) => {
                    search(keyword);
                }),
                internalLinkDecorator,
                imageDecorator,
                comeFromLinkHighlightPlugin(
                    () => Object.keys(comefromLinks),
                    findOrCreateEntry,
                ),
                EditorView.domEventHandlers({ paste: handlePaste }),
                keymap.of(customKeymap),
                markdown({
                    base: markdownLanguage, // enable github flavored markdown
                    codeLanguages: languages,
                }),
                autocompletion({ override: [myCompletion] }),
                oneDark,
                mermaidPlugin(),
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

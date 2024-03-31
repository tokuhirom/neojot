<script lang="ts">
    import { onMount } from 'svelte';
    import { EditorView, type KeyBinding, keymap } from '@codemirror/view';
    import { invoke } from '@tauri-apps/api/core';
    import {
        EditorState,
        type Extension,
        Transaction,
    } from '@codemirror/state';
    import {
        defaultKeymap,
        history,
        indentLess,
        indentMore,
        redo,
        undo,
    } from '@codemirror/commands';
    import { taskKeymap, todoPlugin } from './TodoWidget';
    import { imageDecorator } from './ImageViewWidget';
    import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
    import { languages } from '@codemirror/language-data';
    import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
    import { mermaidPlugin } from './MermaidWidget';
    import { syntaxHighlighting } from '@codemirror/language';
    import { openSearchPanel, searchKeymap } from '@codemirror/search';

    let container;
    export let view: EditorView;
    export let initialContent: () => Promise<string>;
    export let extensions: Extension[];
    export let onUpdateText: (string) => Promise<void>;
    export let keymaps: KeyBinding[];

    const customKeymap: KeyBinding[] = [
        ...keymaps,
        { key: 'Mod-z', run: undo, preventDefault: true },
        { key: 'Mod-Shift-z', run: redo, preventDefault: true },
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
        ...searchKeymap,
        ...defaultKeymap, // 標準のキーマップを含める
    ];

    onMount(async () => {
        const doc = await initialContent();
        let startState = EditorState.create({
            doc,
            extensions: [
                keymap.of(taskKeymap),
                todoPlugin,
                keymap.of(customKeymap),
                history(),
                imageDecorator,
                markdown({
                    base: markdownLanguage, // enable github flavored markdown
                    codeLanguages: languages,
                }),
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
                            await onUpdateText(view.state.doc.toString());
                        }
                    }
                }),
                ...extensions,
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
</script>

<div class="wrapper">
    <div bind:this={container}></div>
</div>

<style>
    .wrapper {
        width: 100%;
    }
</style>

<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { EditorView } from '@codemirror/view';
    import { invoke } from '@tauri-apps/api/core';
    import {
        EditorState,
        type Extension,
        Transaction,
    } from '@codemirror/state';
    import { history } from '@codemirror/commands';
    import { todoPlugin } from './TodoWidget';
    import { imageDecorator } from './ImageViewWidget';
    import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
    import { languages } from '@codemirror/language-data';
    import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
    import { mermaidPlugin } from './MermaidWidget';
    import { syntaxHighlighting } from '@codemirror/language';

    let container;
    export let view: EditorView;
    export let initialContent: string;
    export let extensions: Extension[];
    export let onUpdateText: (string) => Promise<void>;

    const dispatch = createEventDispatcher();

    onMount(() => {
        let startState = EditorState.create({
            doc: initialContent,
            extensions: [
                history(),
                todoPlugin,
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
                            console.log(
                                `テキストが変更されました ${isUserInput}`,
                            );
                            let state = view.state;
                            let doc = state.doc;
                            let text = doc.toString();
                            await onUpdateText(text);
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

        dispatch('viewCreated', { view });
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

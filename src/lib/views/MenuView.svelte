<script lang="ts">
    // open '00menu.md' and read the content.
    import {
        BaseDirectory,
        exists,
        readTextFile,
        writeTextFile,
    } from '@tauri-apps/plugin-fs';
    import { onMount } from 'svelte';
    import BasicCodeMirror6 from '../markdown/BasicCodeMirror6.svelte';
    import type { EditorView } from '@codemirror/view';
    import { Transaction } from '@codemirror/state';
    import { internalLinkPlugin } from '../markdown/InternalWikiLink';

    export let findOrCreateEntry: (pageName: string) => void;

    let view: EditorView;

    let menu = '';
    onMount(async () => {
        const menu = await readMenu();
        let state = view.state;
        let transaction = state.update({
            changes: {
                from: 0,
                to: state.doc.length,
                insert: menu,
            },
            annotations: Transaction.userEvent.of('program'),
        });
        view.dispatch(transaction);
    });

    async function readMenu() {
        if (await exists('00menu.md', { baseDir: BaseDirectory.AppData })) {
            console.log('00menu.md exists');
            return await readTextFile('00menu.md', {
                baseDir: BaseDirectory.AppData,
            });
        } else {
            console.log('00menu.md does not exist');
            // TODO: メニューをクリックできるように
            // TODO: TODO とかの使い方をメニューに入れる
            return `# NeoJot\n\n- [[Home]]\n- [[About]]\n`;
        }
    }

    // save 00menu.md
    async function onUpdateText(text: string) {
        console.log('onUpdateText', text);
        await writeTextFile('00menu.md', text, {
            baseDir: BaseDirectory.AppData,
        });
    }

    let extensions = [internalLinkPlugin(findOrCreateEntry)];
</script>

<div class="wrapper">
    <BasicCodeMirror6
        bind:view
        initialContent={menu}
        {extensions}
        {onUpdateText}
    />
</div>

<style>
    .wrapper {
        width: 100%;
        height: 100px;
    }
</style>

<script lang="ts">
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
    import { nord } from 'cm6-theme-nord';
    import { taskPlugin } from '../markdown/TaskPlugin';
    import type { FileItem } from '../file_item/FileItem';
    import type { Task } from '../task/Task';
    import { openInternalLink } from '../markdown/KeyHandler';

    export let findOrCreateEntry: (pageName: string) => void;
    export let dataFileItems: FileItem[];
    export let openTask: (task: Task) => void;
    export let existsEntry: (title: string) => boolean;

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
            return `# NeoJot\n\n- [[Home]]\n- [[About]]\n\n%tasks\n`;
        }
    }

    // save 00menu.md
    async function onUpdateText(text: string) {
        console.log('onUpdateText', text);
        await writeTextFile('00menu.md', text, {
            baseDir: BaseDirectory.AppData,
        });
    }

    let extensions = [
        internalLinkPlugin(existsEntry, findOrCreateEntry),
        nord,
        taskPlugin(() => dataFileItems, openTask),
    ];

    let keymaps = [
        {
            key: 'Mod-b',
            run: (view: EditorView) =>
                openInternalLink(view, findOrCreateEntry),
        },
    ];
</script>

<div class="wrapper">
    <BasicCodeMirror6
        bind:view
        initialContent={menu}
        {extensions}
        {onUpdateText}
        {keymaps}
    />
</div>

<style>
    .wrapper {
        width: 100%;
        height: 100px;
    }
</style>

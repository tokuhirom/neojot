<script lang="ts">
    import {
        BaseDirectory,
        exists,
        readTextFile,
        writeTextFile,
    } from '@tauri-apps/plugin-fs';
    import BasicCodeMirror6 from '../markdown/BasicCodeMirror6.svelte';
    import type { EditorView } from '@codemirror/view';
    import { internalLinkPlugin } from '../markdown/InternalWikiLink';
    import { nord } from 'cm6-theme-nord';
    import { taskPlugin } from '../markdown/TaskPlugin';
    import type { FileItem } from '../file_item/FileItem';
    import type { Task } from '../task/Task';
    import { openInternalLink } from '../markdown/KeyHandler';

    export let findOrCreateEntry: (pageName: string) => void;
    export let dataFileItems: FileItem[];
    export let openTask: (task: Task) => void;
    export let findEntryByTitle: (title: string) => FileItem | undefined;

    let view: EditorView;

    async function initialContent() {
        if (await exists('00QuickPad.md', { baseDir: BaseDirectory.AppData })) {
            console.log('00QuickPad.md exists');
            return await readTextFile('00QuickPad.md', {
                baseDir: BaseDirectory.AppData,
            });
        } else {
            console.log('00QuickPad.md does not exist');
            // TODO: TODO とかの使い方をメニューに入れる
            return `# NeoJot\n\n- [[Home]]\n- [[About]]\n\n%tasks\n`;
        }
    }

    // save 00QuickPad.md
    async function onUpdateText(text: string) {
        console.log('onUpdateText', text);
        await writeTextFile('00QuickPad.md', text, {
            baseDir: BaseDirectory.AppData,
        });
    }

    let extensions = [
        internalLinkPlugin(findEntryByTitle, findOrCreateEntry),
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
        {initialContent}
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

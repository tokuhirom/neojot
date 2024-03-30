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
    import { openInternalLink } from '../markdown/KeyHandler';
    import { debounce } from '../utils/Debounce';

    export let findOrCreateEntry: (pageName: string) => void;
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

    const debouncedUpdateText = debounce(async (text: string) => {
        console.log(`テキストが変更されました`);
        await writeTextFile('00QuickPad.md', text, {
            baseDir: BaseDirectory.AppData,
        });
    }, 500);

    function onUpdateText(text: string) {
        debouncedUpdateText(text);
    }

    let extensions = [
        internalLinkPlugin(findEntryByTitle, findOrCreateEntry),
        nord,
        taskPlugin(),
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

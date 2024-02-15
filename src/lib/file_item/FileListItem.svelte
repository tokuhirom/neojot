<script lang="ts">
    import type { FileItem } from './FileItem';
    import { listen } from '@tauri-apps/api/event';
    import { onDestroy } from 'svelte';

    export let onSelectItem: (fileItem: FileItem) => void;
    export let fileItem: FileItem;
    export let selectedItem: FileItem;

    const unlisten = listen('change_title', (e) => {
        const payload = e.payload as { filename: string };
        if (payload.filename === fileItem.filename) {
            fileItem = fileItem;
        }
    });
    onDestroy(async () => {
        (await unlisten)();
    });

    function handleOnClick() {
        onSelectItem(fileItem);
    }

    function formatEpochSeconds() {
        const epochSeconds = fileItem.mtime;
        const date = new Date(epochSeconds * 1000); // エポックミリ秒に変換
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月は0から始まるため、1を足す
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
</script>

<div>
    <button
        on:click={handleOnClick}
        class:active={selectedItem.filename === fileItem.filename}
        ><span class="title">{fileItem.title}</span>
        <span class="mtime">{formatEpochSeconds()}</span>
        <span class="filename">{fileItem.filename.replace(/.+\//, '')}</span>
    </button>
</div>

<style>
    .mtime {
        display: block;
        font-size: 60%;
        color: darkgrey;
        float: left;
    }

    button {
        width: 100%;

        background: none;
        color: inherit;
        border: none;
        padding: 8px;
        margin: 0;
        font: inherit;
        cursor: pointer;
        border-bottom: darkslategrey 1px solid;

        text-align: left;
        overflow-x: hidden;
    }

    .title {
        display: block;
        overflow-y: hidden;
        min-height: 1em;
    }

    .filename {
        color: darkgrey;
        font-size: 80%;
        float: right;
    }

    button.active {
        background-color: midnightblue;
    }
</style>

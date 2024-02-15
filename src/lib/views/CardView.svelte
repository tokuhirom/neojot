<script lang="ts">
    import {
        archiveFile,
        loadFileList,
        loadMarkdownFile,
    } from '../repository/NodeRepository';
    import type { FileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import { onDestroy, onMount } from 'svelte';
    import { listen, type UnlistenFn } from '@tauri-apps/api/event';
    import LinkCards from '../link/LinkCards.svelte';
    import FileCardItem from '../card/FileCardItem.svelte';

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (fileItem: FileItem | undefined) => void;

    let unlistenCallbackPromises: Promise<UnlistenFn>[] = [];
    unlistenCallbackPromises.push(
        listen('do_created', async (event) => {
            const fileItem = event.payload as FileItem;
            console.log(`CardView.do_created: ${fileItem.filename}`);
            if (
                !dataFileItems.some(
                    (item) => item.filename === fileItem.filename,
                )
            ) {
                dataFileItems.unshift(fileItem);
                selectedItem = fileItem;
            }
        }),
    );
    onDestroy(async () => {
        for (let unlistenCallbackPromise of unlistenCallbackPromises) {
            (await unlistenCallbackPromise)();
        }
    });

    async function openEntry(fileItem: FileItem) {
        console.log(`open: ${fileItem.filename}`);
        onSelectItem(fileItem);
    }
</script>

<div class="container">
    {#if selectedItem}
        <button
            class="back-to-list"
            on:click={() => {
                selectedItem = undefined;
                onSelectItem(undefined);
            }}
        >
            Back to List
        </button>

        <EntryView file={selectedItem} {allFileItems} {onSelectItem} />
        <LinkCards file={selectedItem} {allFileItems} {onSelectItem} />
    {:else}
        {#each dataFileItems as file}
            <FileCardItem {onSelectItem} {file} />
        {/each}
    {/if}
</div>

<style>
    .container {
        width: 100%;
    }

    .back-to-list {
        background-color: darkslategrey;
        color: white;
        padding: 9px;
        font-weight: bold;
        margin-top: 9px;
        margin-bottom: 20px;
    }
</style>

<script lang="ts">
    import {archiveFile, createNewFile, loadFileList, loadMarkdownFile} from "./repository/NodeRepository";
    import type {FileItem} from "./FileItem";
    import EntryView from "./EntryView.svelte";
    import {onDestroy, onMount} from "svelte";
    import {listen} from "@tauri-apps/api/event";
    import CardItem from "./CardItem.svelte";

    export let fileItems: FileItem[] = [];
    let selectedItem: FileItem | undefined = undefined;

    onMount(async () => {
        fileItems = await loadFileList("data", true);
    });

    let unlistenSortFileList = listen("sort_file_list", async () => {
        fileItems.sort((a, b) => b.mtime - a.mtime);
        fileItems = fileItems;
    });
    let unlistenDoNewFile = listen("do_new_file", async () => {
        await createNewFile();
        fileItems = await loadFileList("data", true);
        selectedItem = fileItems[0];
    })
    let unlistenArchive = listen("do_archive", async () => {
        if (selectedItem) {
            await archiveFile(selectedItem);
            selectedItem = undefined;
        }
    })
    onDestroy(async () => {
        for (let unlisten of [unlistenDoNewFile, unlistenSortFileList, unlistenArchive]) {
            (await unlisten)();
        }
    });

    async function openEntry(fileItem: FileItem) {
        console.log(`open: ${fileItem.filename}`)
        // reload content from file system
        fileItem.content = await loadMarkdownFile(fileItem.filename);
        selectedItem = fileItem;
    }
</script>

<div class="container">
    {#if selectedItem}
        <button class="back-to-list" on:click={() => selectedItem=undefined}>Back to List</button>

        <EntryView
                   file={selectedItem}
                   fileItems={fileItems}
                   openEntry={openEntry} />
    {:else}
        {#each fileItems as file}
            <CardItem onSelect={openEntry} file={file} />
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

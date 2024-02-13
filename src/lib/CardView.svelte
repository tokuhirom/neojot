<script lang="ts">
    import {
        archiveFile,
        createNewFileWithContent,
        loadFileList,
        loadMarkdownFile
    } from "./repository/NodeRepository";
    import type {FileItem} from "./FileItem";
    import EntryView from "./EntryView.svelte";
    import {onDestroy, onMount} from "svelte";
    import {listen, type UnlistenFn} from "@tauri-apps/api/event";
    import LinkCards from "./LinkCards.svelte";
    import FileCardItem from "./FileCardItem.svelte";

    export let fileItems: FileItem[] = [];
    let selectedItem: FileItem | undefined = undefined;

    onMount(async () => {
        fileItems = await loadFileList("data", true);
    });

    let unlistenCallbackPromises: Promise<UnlistenFn>[] = [];
    unlistenCallbackPromises.push(listen("sort_file_list", async () => {
        fileItems.sort((a, b) => b.mtime - a.mtime);
        fileItems = fileItems;
    }));
    unlistenCallbackPromises.push(listen("do_created", async (event) => {
        const fileItem = event.payload as FileItem;
        console.log(`CardView.do_created: ${fileItem.filename}`)
        if (!fileItems.some(item => item.filename === fileItem.filename)) {
            fileItems.unshift(fileItem);
            selectedItem = fileItem;
        }
    }));
    unlistenCallbackPromises.push(listen("do_archive", async () => {
        if (selectedItem) {
            await archiveFile(selectedItem);
            fileItems = await loadFileList("data", true);
            selectedItem = undefined;
        }
    }));
    onDestroy(async () => {
        for (let unlistenCallbackPromise of unlistenCallbackPromises) {
            (await unlistenCallbackPromise)();
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
        <LinkCards file={selectedItem} fileItems={fileItems} openEntry={openEntry} />
    {:else}
        {#each fileItems as file}
            <FileCardItem onSelect={openEntry} file={file} />
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

<script lang="ts">
    import {createNewFile, loadFileList, loadMarkdownFile} from "./repository/NodeRepository";
    import type {FileItem} from "./FileItem";
    import EntryView from "./EntryView.svelte";
    import {onDestroy, onMount} from "svelte";
    import {listen} from "@tauri-apps/api/event";

    export let fileItems: FileItem[] = [];
    let selectedItem: FileItem | undefined = undefined;

    onMount(async () => {
        fileItems = await loadFileList(true);
    });

    let unlistenSortFileList = listen("sort_file_list", async () => {
        fileItems.sort((a, b) => b.mtime - a.mtime);
        fileItems = fileItems;
    });
    let unlistenDoNewFile = listen("do_new_file", async () => {
        await createNewFile();
        fileItems = await loadFileList(true);
        selectedItem = fileItems[0];
    })
    onDestroy(async () => {
        for (let unlisten of [unlistenDoNewFile, unlistenSortFileList]) {
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
            <button class="card" on:click={() => selectedItem = file}>
                <span class="title">{file.title.replace(/TODO: /, "☐️").replace(/DONE: /, "☑")}</span>
                <span class="content">{file.content.split('\n').slice(1).join('\n')}</span>
            </button>
        {/each}
    {/if}
</div>

<style>
    .container {
        width: 100%;
    }

    .card {
        display: flex; /* Flexboxを有効にします */
        flex-direction: column; /* アイテムを縦方向に並べます */
        align-items: flex-start; /* 左寄せにします（テキストが左揃えの場合） */
        justify-content: flex-start; /* アイテムを上に寄せます */
        float: left;
        width: 100px;
        margin: 9px;
        background-color: #f6f6f6;
        color: #0f0f0f;
        padding: 9px;
        height: 120px;
        overflow-y: hidden;;
        border-radius: 2px;
        text-align: left;
        vertical-align: top;
    }

    .title {
        font-size: 15px;
        font-weight: bold;
        word-break: break-all;
    }

    .content {
        font-size: 10px;
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

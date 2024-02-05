<script lang="ts">

    import EntryView from "./EntryView.svelte";
    import FileListItem from "./FileListItem.svelte";
    import {type FileItem, shouldShowFileItem} from "./FileItem";
    import {archiveFile, createNewFile, loadFileList, loadMarkdownFile} from "./repository/NodeRepository";
    import {onDestroy, onMount} from "svelte";
    import {listen} from "@tauri-apps/api/event";

    let fileItems: FileItem[] = [];

let filteredFileItems: FileItem[];
let selectedItem: FileItem | undefined;

let searchWord = "";

$: if (fileItems || searchWord) {
    filteredFileItems = fileItems.filter(it => shouldShowFileItem(it, searchWord));
}

onMount(async () => {
    fileItems = await loadFileList("data", true);

    selectedItem = fileItems[0];
});

async function openEntry(fileItem: FileItem) {
    console.log(`open: ${fileItem.filename}`)
    // reload content from file system
    fileItem.content = await loadMarkdownFile(fileItem.filename);
    selectedItem = fileItem;
}

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
        console.log(`Archiving: ${selectedItem.filename}`)
        await archiveFile(selectedItem);
        fileItems = await loadFileList("data", true);
        selectedItem = fileItems[0];
    }
})
onDestroy(async () => {
    for (let unlisten of [unlistenDoNewFile, unlistenSortFileList, unlistenArchive]) {
        (await unlisten)();
    }
});
</script>

<div class="list-view">
    <div class="file-list">
        <input type="text" class="search-box" bind:value={searchWord} />
        {#if filteredFileItems && selectedItem}
            {#each filteredFileItems as fileItem}
                <FileListItem openEntry={openEntry}
                              fileItem={fileItem}
                              selectedItem={selectedItem} />
            {/each}
        {/if}
    </div>
    <div class="log-view">
        {#if selectedItem !== undefined}
            <EntryView
                       file={selectedItem}
                       fileItems={fileItems}
                       openEntry={openEntry} />
        {/if}
    </div>
</div>

<style>
    .list-view {
        display: flex; /* Enables Flexbox */
        flex-direction: row; /* Stack children vertically */
        height: 100vh;
        padding-left: 8px;
        padding-right: 8px;
    }

    .search-box {
        width: 100%;
        font-size: 120%;
        display: block;
        margin-top: 9px;
        margin-bottom: 9px;
    }

    .file-list {
        flex: 0 0 250px;
        overflow-y: auto;
        padding-right: 9px;
        padding-left: 4px;
        overflow-x: hidden;
        word-break: break-word;
        white-space: normal;
    }

    .log-view {
        flex: 0 0 68%;
        /*overflow-x: hidden;*/
        padding-inline-start: 0;
        flex-grow: 1;
        margin-block-start: 0;
        margin-block-end: 0;
    }
</style>
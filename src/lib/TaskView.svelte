<script lang="ts">
import {onMount} from "svelte";
import {loadFileList} from "./repository/NodeRepository";
import {type FileItem, shouldShowFileItem} from "./FileItem";
import EntryView from "./EntryView.svelte";

let fileItems: FileItem[] = [];
let filteredFileItems: FileItem[] = [];
let selectedItem: FileItem | undefined = undefined;

onMount(async () => {
    fileItems = await loadFileList("data", true);
    filteredFileItems = fileItems.filter(it => it.title.includes("TODO:"));
    selectedItem = fileItems[0];
});

async function openFile(fileItem: FileItem) {
    selectedItem = fileItem;
}
</script>

<div class="task-view">
    <div class="file-list">
    {#each filteredFileItems as fileItem}
        <button on:click={() => openFile(fileItem)}>{fileItem.title}</button>
    {/each}
    </div>
    <div class="log-view">
        {#if selectedItem !== undefined}
            <EntryView
                    file={selectedItem}
                    fileItems={fileItems}
                    openEntry={openFile} />
        {/if}
    </div>
</div>

<style>
    .task-view {
        display: flex; /* Enables Flexbox */
        flex-direction: row; /* Stack children vertically */
        height: 100vh;
        padding-left: 8px;
        padding-right: 8px;
    }
    .file-list {
        flex: 0 0 30%;
        overflow-y: auto;
        padding-right: 9px;
        padding-left: 4px;
        overflow-x: hidden;
        word-break: break-word;
        white-space: normal;
    }
    .file-list button {
        display: block;
        word-break: break-all;
        width: 100%;
        text-align: left;
        background: none;
        color: inherit;
        border: none;
        padding: 8px;
        margin: 0;
        font: inherit;
        cursor: pointer;
        border-bottom: darkslategrey 1px solid;
        overflow-x: hidden;
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

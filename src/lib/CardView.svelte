<script lang="ts">
import {NodeRepository} from "./repository/NodeRepository";
import type {FileItem} from "./FileItem";
import EntryView from "./EntryView.svelte";

export let nodeRepository: NodeRepository;
export let fileItems: FileItem[];
let selectedFile: FileItem | undefined = undefined;

async function openEntry(fileItem: FileItem) {
    console.log(`open: ${fileItem.filename}`)
    // reload content from file system
    fileItem.content = await nodeRepository.load(fileItem.filename);
    selectedFile = fileItem;
}

</script>

<div>
    {#if selectedFile}
        <button class="back-to-list" on:click={() => selectedFile=undefined}>Back to List</button>

        <EntryView nodeRepository={nodeRepository}
                   file={selectedFile}
                   fileItems={fileItems}
                   openEntry={openEntry} />
    {:else}
        {#each fileItems as file}
            <button class="card" on:click={() => selectedFile = file}>
                <span class="title">{file.title.replace(/TODO: /, "☐️").replace(/DONE: /, "☑")}</span>
                <span class="content">{file.content.split('\n').slice(1).join('\n')}</span>
            </button>
        {/each}
    {/if}
</div>

<style>
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

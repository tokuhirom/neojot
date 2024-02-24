<script lang="ts">
    import { type FileItem, shouldShowFileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';
    import FileCardItem from '../card/FileCardItem.svelte';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let title2fileItem: Record<string, FileItem>;
    export let comefromLinks: Record<string, FileItem>;

    let filteredFileItems: FileItem[];
    let searchWord = '';

    $: if (dataFileItems || searchWord) {
        filteredFileItems = dataFileItems.filter((it) =>
            shouldShowFileItem(it, searchWord),
        );
    }

    function onSaved() {
        selectedItem = selectedItem;
    }

    function onCreateItem(fileItem: FileItem) {
        dataFileItems.unshift(fileItem);
        allFileItems.unshift(fileItem);
        dataFileItems = dataFileItems;
        allFileItems = allFileItems;
        onSelectItem(fileItem);
    }
</script>

<div class="container">
    <ClearableSearchBox bind:searchWord />
    {#if selectedItem}
        <button class="back-to-list" on:click={() => onSelectItem(undefined)}>
            Back to List
        </button>

        <EntryView
            file={selectedItem}
            {allFileItems}
            {onSelectItem}
            {onSaved}
            {onCreateItem}
            {title2fileItem}
            {comefromLinks}
            search={undefined}
        />
        <LinkCards
            file={selectedItem}
            {allFileItems}
            {onSelectItem}
            {onCreateItem}
        />
    {:else}
        {#each filteredFileItems as file}
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

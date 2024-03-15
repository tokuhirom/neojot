<script lang="ts">
    import { type FileItem, shouldShowFileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';
    import FileCardItem from '../card/FileCardItem.svelte';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';
    import ExcalidrawView from '../excalidraw/ExcalidrawView.svelte';
    import { makeMigemoRegexes } from '../search/Migemo';

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let pageTitles: string[];
    export let findEntryByTitle: (title: string) => FileItem | undefined;
    export let autoLinks: string[];

    let filteredFileItems: FileItem[];
    let searchWord = '';

    let migemoRegexes: RegExp[] = [];
    $: if (searchWord) {
        makeMigemoRegexes(searchWord).then((r) => {
            migemoRegexes = r;
        });
    }

    $: if (dataFileItems || migemoRegexes) {
        filteredFileItems = dataFileItems.filter((it) =>
            shouldShowFileItem(it, searchWord, migemoRegexes),
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

        {#if selectedItem.filename.endsWith('.excalidraw')}
            <div class="excalidraw-container">
                <ExcalidrawView {selectedItem} />
            </div>
        {:else}
            <EntryView
                file={selectedItem}
                {allFileItems}
                {onSelectItem}
                {onSaved}
                {onCreateItem}
                {pageTitles}
                f
                search={undefined}
                {findEntryByTitle}
                {autoLinks}
            />
            <LinkCards
                file={selectedItem}
                {allFileItems}
                {onSelectItem}
                {onCreateItem}
            />
        {/if}
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

    .excalidraw-container {
        width: 100%;
        height: 80vh;
    }
</style>

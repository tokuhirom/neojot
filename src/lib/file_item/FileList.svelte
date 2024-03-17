<script lang="ts">
    import FileListItem from './FileListItem.svelte';
    import { searchFileItems, type SearchResult } from './Search';
    import {
        dataFileItemsStore,
        searchKeywordStore,
        searchRegexesStore,
    } from '../../Stores';
    import type { FileItem } from './FileItem';

    export let viewerMode: boolean = false;
    export let enterViewerMode: () => void = () => {};

    let searchResult: SearchResult[];

    let dataFileItems: FileItem[] = [];
    dataFileItemsStore.subscribe((value) => {
        dataFileItems = value;
    });

    let searchKeyword: string = '';
    searchKeywordStore.subscribe((value) => {
        searchKeyword = value;
    });

    let searchRegexes: RegExp[] | undefined = undefined;
    searchRegexesStore.subscribe((value) => {
        searchRegexes = value;
    });

    $: {
        searchResult = searchFileItems(
            dataFileItems,
            searchKeyword,
            searchRegexes,
        );
    }
</script>

<div>
    {#if searchResult}
        {#each searchResult as result (result.fileItem.filename)}
            <FileListItem
                fileItem={result.fileItem}
                matchLines={result.lines}
                {enterViewerMode}
                {viewerMode}
            />
        {/each}
    {/if}
</div>

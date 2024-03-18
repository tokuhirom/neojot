<script lang="ts">
    import FileListItem from './FileListItem.svelte';
    import { type SearchResult } from './Search';
    import { searchFilteredFileItemsStore } from '../../Stores';

    export let viewerMode: boolean = false;
    export let enterViewerMode: () => void = () => {};

    let searchResult: SearchResult[];
    searchFilteredFileItemsStore.subscribe((value) => {
        searchResult = value;
    });
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

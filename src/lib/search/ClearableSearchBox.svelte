<script lang="ts">
    import {
        dataFileItemsStore,
        searchFilteredFileItemsStore,
        searchKeywordStore,
        searchRegexesStore,
    } from '../../Stores.ts';
    import { makeMigemoRegexes } from './Migemo';
    import { type FileItem } from '../file_item/FileItem.ts';
    import { searchFileItems, type SearchResult } from '../file_item/Search';

    let migemoRegexes: RegExp[] | undefined = undefined;
    searchKeywordStore.subscribe(async (value) => {
        console.log('searchKeywordStore.subscribe', value);
        if (value === '') {
            searchRegexesStore.set(undefined);
        } else {
            searchRegexesStore.set(await makeMigemoRegexes(value));
        }
    });
    searchRegexesStore.subscribe((value) => {
        migemoRegexes = value;
    });
    let dataFileItems: FileItem[] = [];
    dataFileItemsStore.subscribe((value) => {
        dataFileItems = value;
    });
    $: if (dataFileItems) {
        // TODO debounce?
        if (migemoRegexes) {
            searchFilteredFileItemsStore.set(
                searchFileItems(
                    dataFileItems,
                    $searchKeywordStore, // TODO maybe never used
                    migemoRegexes,
                ),
            );
        } else {
            searchFilteredFileItemsStore.set(
                dataFileItems.map((fileItem) => {
                    return { lines: [], fileItem } as SearchResult;
                }),
            );
        }
    }
</script>

<div class="clearable-search-box">
    <input type="text" bind:value={$searchKeywordStore} class="search-input" />
    {#if $searchKeywordStore}
        <button class="clear-btn" on:click={() => ($searchKeywordStore = '')}
            >✗</button
        >
    {/if}
</div>

<style>
    .clearable-search-box {
        position: relative;
        display: inline-block;
        width: 100%;
        margin-top: 9px;
        margin-bottom: 9px;
    }
    .search-input {
        font-size: 140%;
        width: 100%;
    }
    .clear-btn {
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background-color: transparent;
        cursor: pointer;
    }
</style>

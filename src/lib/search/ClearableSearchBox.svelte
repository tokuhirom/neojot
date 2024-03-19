<script lang="ts">
    import {
        dataFileItemsStore,
        searchFilteredFileItemsStore,
        searchKeywordStore,
        searchRegexesStore,
    } from '../../Stores.ts';
    import { makeMigemoRegexes } from './Migemo';
    import { type FileItem } from '../file_item/FileItem.ts';
    import { searchFileItems } from '../file_item/Search';
    import BasicClearableSearchBox from './BasicClearableSearchBox.svelte';

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
        searchFilteredFileItemsStore.set(
            searchFileItems(dataFileItems, migemoRegexes),
        );
    }
</script>

<BasicClearableSearchBox bind:keyword={$searchKeywordStore} />

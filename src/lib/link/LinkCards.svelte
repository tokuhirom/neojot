<script lang="ts">
    import { type FileItem } from '../file_item/FileItem';
    import FileCardItem from '../card/FileCardItem.svelte';
    import { buildLinks, type Links } from './Links';
    import CardItem from '../card/CardItem.svelte';
    import { createNewFileWithContent } from '../repository/NodeRepository';
    import {
        dataFileItemsStore,
        lowerTitle2fileItemStore,
        selectedItemStore,
    } from '../../Stores';

    export let file: FileItem;

    let lowerTitle2fileItem = {};
    lowerTitle2fileItemStore.subscribe((value) => {
        lowerTitle2fileItem = value;
    });

    let links: Links | undefined = undefined;

    $: if (file) {
        links = buildLinks(file, lowerTitle2fileItem, $dataFileItemsStore);
    }

    async function createNewEntry(title: string) {
        const fileItem = await createNewFileWithContent(`# ${title}\n\n`);
        $dataFileItemsStore = [...$dataFileItemsStore, fileItem];
        $selectedItemStore = fileItem;
    }
</script>

<div>
    {#if links}
        <div class="row">
            {#each links.links as file}
                <FileCardItem {file} />
            {/each}
        </div>
        {#each links.twoHopLinks as twoHopLink}
            <div class="row">
                <FileCardItem
                    file={twoHopLink.src}
                    backgroundColor="yellowgreen"
                />
                {#each twoHopLink.dst as dst}
                    <FileCardItem file={dst} />
                {/each}
            </div>
        {/each}
        {#if links.newLinks.length > 0}
            <div class="row">
                <CardItem
                    title="New Link"
                    content=""
                    backgroundColor="darkgoldenrod"
                    onClick={() => false}
                />
                {#each links.newLinks as title}
                    <CardItem
                        {title}
                        content=""
                        color="gray"
                        onClick={() => createNewEntry(title)}
                    />
                {/each}
            </div>
        {/if}
    {/if}
</div>

<style>
    .row {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 18px;
    }
</style>

<script lang="ts">
    import { dataFileItemsStore } from '../../Stores';
    import type { FileItem } from '../file_item/FileItem';
    import FileCardItem from '../card/FileCardItem.svelte';

    type MyEntry = {
        title: string;
        items: FileItem[];
    };

    let dataFileItems = [];
    let duplicatedNotes: MyEntry[] = [];
    dataFileItemsStore.subscribe((value) => {
        dataFileItems = value;

        let title2fileItems: Record<string, FileItem[]> = {};
        dataFileItems.forEach((item: FileItem) => {
            if (title2fileItems[item.title]) {
                title2fileItems[item.title].push(item);
            } else {
                title2fileItems[item.title] = [item];
            }
        });

        // find entry that has 2+ items
        duplicatedNotes = Object.entries(title2fileItems)
            .filter(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ([_title, items]) => items.length > 1,
            )
            .map(([title, items]) => ({ title, items }) as MyEntry);
    });
</script>

<div>
    {#if duplicatedNotes.length > 0}
        Duplicated entries:
        <div class="dups">
            {#each duplicatedNotes as k (k.title)}
                <div class="dup">
                    <h2>{k.title}</h2>
                    {#each k.items as item}
                        <FileCardItem file={item} />
                    {/each}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .dups {
        display: flex;
        flex-wrap: wrap;
        clear: both;
    }

    .dup {
        margin: 10px;
        padding: 10px;
        border: 1px solid #ccc;
    }
</style>

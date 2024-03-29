<script lang="ts">
    import { DataSet } from 'vis-data/esnext';
    import { Network } from 'vis-network/esnext';
    import 'vis-network/styles/vis-network.css';
    import { dataFileItemsStore } from '../../Stores';
    import type { FileItem } from '../file_item/FileItem';
    import { extractLinks } from '../link/Links';
    import DuplicatedNotes from '../markdown/DuplicatedNotes.svelte';
    import OpenAIView from '../openai/OpenAIView.svelte';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';
    import ExcalidrawView from '../excalidraw/ExcalidrawView.svelte';
    import { onMount } from 'svelte';

    export let pageTitles: string[];
    export let findEntryByTitle: (title: string) => FileItem | undefined;
    export let autoLinks: string[];

    let container;

    let selectedItem: FileItem | undefined = undefined;

    let dataFileItems: FileItem[] = [];
    const title2id = {};
    const id2title = {};
    let forwardLinks: Map<string, string[]> = new Map();
    dataFileItemsStore.subscribe((value) => {
        dataFileItems = value;

        dataFileItems.forEach((it, i) => {
            title2id[it.title] = i;
            id2title[i] = it.title;
        });

        const { forward }: { forward: Map<string, string[]> } =
            extractLinks(dataFileItems);
        forwardLinks = forward;
    });

    const nodes = new DataSet();
    const edges = new DataSet();

    let network: Network | undefined = undefined;

    onMount(() => {
        const data = {
            nodes: nodes,
            edges: edges,
        };
        const options = {
            layout: {
                // fix the random seed to generate the same graph each time
                randomSeed: 0,
                improvedLayout: false,
            },
        };

        network = new Network(container, data, options);
        showProgress = true;
        network.on('doubleClick', function (params) {
            console.log(params);
            if (params.nodes && params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const title = id2title[nodeId];
                console.log('DOUBLE CLICK', title);
                selectedItem = findEntryByTitle(title);
            }
        });
        network.on('stabilized', function () {
            console.log('stabilized');
            showProgress = false;
        });
        console.log('DONE');
    });

    let showProgress = false;
    $: if (container && dataFileItems.length) {
        // create an array with nodes
        nodes.update(
            dataFileItems.map((it, i) => {
                return { id: i, label: it.title, shape: 'box' };
            }),
        );

        // create an array with edges
        // each forward key and value is a link
        const rawEdges = new Set();
        for (const [from, tos] of forwardLinks) {
            for (const to of tos) {
                const fromId = title2id[from];
                const toId = title2id[to];
                const edgeKey = `${fromId}-${toId}`;
                rawEdges.add(edgeKey);
            }
        }
        // Support edge deleting
        edges.update(
            Array.from(rawEdges).map((key) => {
                const [from, to] = key.split('-');
                return {
                    id: key,
                    arrows: 'to',
                    from: parseInt(from, 10),
                    to: parseInt(to, 10),
                };
            }),
        );
    }

    function onSaved(fileItem: FileItem) {
        if (network) {
            network.focus(title2id[fileItem.title]);
        }
    }
</script>

<div>
    <div style:display={showProgress ? 'block' : 'none'}>Now loading...</div>
    <div class="network-view">
        <div bind:this={container} class="network-container"></div>
        <!-- eslint-disable-next-line -->
        <div class="log-view">
            {#if selectedItem !== undefined}
                {#if selectedItem.filename.endsWith('.excalidraw')}
                    <ExcalidrawView {selectedItem} />
                {:else}
                    <EntryView
                        file={selectedItem}
                        {pageTitles}
                        {findEntryByTitle}
                        {autoLinks}
                        {onSaved}
                    />
                    <DuplicatedNotes file={selectedItem} />
                    <LinkCards file={selectedItem} />
                    <OpenAIView {selectedItem} />
                {/if}
            {/if}
        </div>
    </div>
</div>

<style>
    .network-view {
        display: flex; /* Enables Flexbox */
        flex-direction: row; /* Stack children vertically */
        height: 100vh;
        padding-left: 8px;
        padding-right: 8px;
    }

    .network-container {
        flex: 0 0 47%;
        height: 100vh;
        border-right: #757575 1px solid;
        padding-right: 8px;
    }
    .log-view {
        flex: 0 0 49%;
        /*overflow-x: hidden;*/
        padding-inline-start: 0;
        flex-grow: 1;
        height: 100vh;
        overflow-y: auto;
    }
</style>

<script lang="ts">
    import { DataSet } from 'vis-data/esnext';
    import { Network } from 'vis-network/esnext';
    import 'vis-network/styles/vis-network.css';
    import {
        dataFileItemsStore,
        lowerTitle2fileItemStore,
        selectedItemStore,
    } from '../../Stores';
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
    selectedItemStore.subscribe((value) => {
        selectedItem = value;
    });

    let lowerTitle2filename = {};
    lowerTitle2fileItemStore.subscribe((value: Record<string, FileItem>) => {
        const newMap = {};
        for (let valueKey in value) {
            newMap[valueKey.toLowerCase()] = value[valueKey].filename;
        }
        lowerTitle2filename = newMap;
    });

    let dataFileItems: FileItem[] = [];
    const filename2title = {};
    let forwardLinks: Map<string, string[]> = new Map();
    dataFileItemsStore.subscribe((value) => {
        dataFileItems = value;

        dataFileItems.forEach((it) => {
            lowerTitle2filename[it.title.toLowerCase()] = it.filename;
            filename2title[it.filename] = it.title;
        });

        const { forward }: { forward: Map<string, string[]> } =
            extractLinks(dataFileItems);
        forwardLinks = forward;
    });

    const nodes = new DataSet();
    const edges = new DataSet();

    let network: Network | undefined = undefined;

    onMount(() => {
        console.log('Start NetworkView:onMount()');
        const data = {
            nodes: nodes,
            edges: edges,
        };
        const options = {
            layout: {
                // fix the random seed to generate the same graph each time
                randomSeed: 0,
                improvedLayout: true,
            },
        };

        network = new Network(container, data, options);
        showProgress = true;
        network.on('doubleClick', function (params) {
            console.log(params);
            if (params.nodes && params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const title = filename2title[nodeId];
                console.log('DOUBLE CLICK', title);
                const selectedItem = findEntryByTitle(title);
                selectedItemStore.set(selectedItem);
            }
        });
        network.on('stabilized', function () {
            console.log('stabilized');
            showProgress = false;
        });
        console.log('Finished NetworkView:onMount()');
    });

    let showProgress = false;
    let nodeMap: Record<string, string> = {};
    let edgeSet = new Set();
    $: if (container && dataFileItems.length) {
        // create an array with nodes
        const updateNodes = [];
        const addNodes = [];
        dataFileItems.forEach((it) => {
            if (it.filename in nodeMap) {
                if (it.title !== nodeMap[it.filename]) {
                    // title changed.
                    nodeMap[it.filename] = it.title;
                    updateNodes.push({
                        id: it.filename,
                        label: it.title,
                        shape: 'box',
                    });
                }
                return { id: it.filename, label: it.title, shape: 'box' };
            } else {
                nodeMap[it.filename] = it.title;
                addNodes.push({
                    id: it.filename,
                    label: it.title,
                    shape: 'box',
                });
            }
        });
        if (updateNodes.length > 0) {
            nodes.update(updateNodes);
        }
        if (addNodes.length > 0) {
            nodes.add(addNodes);
        }
        // delete the removed nodes.
        const nodeIds = new Set(dataFileItems.map((it) => it.filename));
        for (const nodeId in nodeMap) {
            if (!nodeIds.has(nodeId)) {
                console.log('delete node', nodeId, nodeMap[nodeId]);
                nodes.remove(nodeId);
                delete nodeMap[nodeId];
            }
        }

        // create an array with edges
        // each forward key and value is a link
        const addEdge = (key: string) => {
            const [from, to] = key.split('\0');
            const edge = {
                id: key,
                arrows: 'to',
                from: from,
                to: to,
            };
            edges.update([edge]);
        };

        const addEdges = [];
        for (const [from, tos] of forwardLinks) {
            for (const to of tos) {
                const fromId = lowerTitle2filename[from.toLowerCase()];
                const toId = lowerTitle2filename[to.toLowerCase()];
                const edgeKey = `${fromId}\0${toId}`;
                if (!edgeSet.has(edgeKey)) {
                    edgeSet.add(edgeKey);
                    addEdges.push(edgeKey);
                }
            }
        }
        if (addEdges.length > 0) {
            edges.add(
                addEdges.map((key) => ({
                    id: key,
                    arrows: 'to',
                    from: key.split('\0')[0],
                    to: key.split('\0')[1],
                })),
            );
        }
        // delete the removed edges.
        for (const edgeId in edgeSet) {
            const [from, to] = edgeId.split('\0');
            if (
                !forwardLinks.has(from) ||
                !forwardLinks.get(from).includes(to)
            ) {
                console.log('delete edge', from, to);
                edges.remove(edgeId);
                edgeSet.delete(edgeId);
            }
        }
    }

    function onSaved(fileItem: FileItem) {
        if (network) {
            network.focus(lowerTitle2filename[fileItem.title.toLowerCase()]);
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

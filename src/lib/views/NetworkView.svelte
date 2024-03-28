<script lang="ts">
    import * as vis from 'vis-network';
    import { DataSet } from 'vis-data/esnext';
    import { Network } from 'vis-network/esnext';
    import 'vis-network/styles/vis-network.css';
    import { onMount } from 'svelte';
    import { dataFileItemsStore } from '../../Stores';
    import type { FileItem } from '../file_item/FileItem';
    import { extractLinks } from '../link/Links';

    let container;

    let dataFileItems: FileItem[] = [];
    dataFileItemsStore.subscribe((value) => {
        dataFileItems = value;
    });

    let showProgress = false;
    $: if (container && dataFileItems.length) {
        // create an array with nodes
        const nodes = new DataSet();
        nodes.add(
            dataFileItems.map((it, i) => {
                return { id: i, label: it.title, shape: 'box' };
            }),
        );
        const title2id = {};
        const id2title = {};
        dataFileItems.forEach((it, i) => {
            title2id[it.title] = i;
            id2title[i] = it.title;
        });

        const {
            forward,
            backward,
        }: { forward: Map<string, string[]>; backward: Map<string, string[]> } =
            extractLinks(dataFileItems);
        console.log('GREAT LINKS', forward, backward);

        // create an array with edges
        const edges = new DataSet();
        // each forward key and value is a link
        const rawEdges = new Set();
        for (const [from, tos] of forward) {
            for (const to of tos) {
                const fromId = title2id[from];
                const toId = title2id[to];
                const edgeKey = `${fromId}-${toId}`;
                rawEdges.add(edgeKey);
            }
        }
        edges.add(
            Array.from(rawEdges).map((key) => {
                const [from, to] = key.split('-');
                return {
                    from: parseInt(from, 10),
                    to: parseInt(to, 10),
                };
            }),
        );

        // provide the data in the vis format
        const data = {
            nodes: nodes,
            edges: edges,
        };
        const options = {
            layout: {
                improvedLayout: false,
            },
        };

        const network = new Network(container, data, options);
        showProgress = true;
        network.on('doubleClick', function (params) {
            const nodes = params.nodes;
            console.log(params);
            if (nodes && nodes.length > 0) {
                const nodeId = nodes[0];
                const title = id2title[nodeId];
                console.log('DOUBLE CLICK', title);
            }
        });
        network.on('stabilized', function () {
            console.log('stabilized');
            showProgress = false;
        });
        console.log('DONE');
    }
</script>

<div>
    <div style:display={showProgress ? 'block' : 'none'}>Now loading...</div>
    <div bind:this={container} class="network-container"></div>
</div>

<style>
    .network-container {
        width: 100%;
        height: 100vh;
    }
</style>

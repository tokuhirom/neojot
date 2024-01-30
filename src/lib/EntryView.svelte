<script lang="ts">

import {NodeRepository} from "./repository/NodeRepository";

export let md: string;
export let fileName: string;
export let nodeRepository: NodeRepository;

async function save() {
    console.log(`SAVING: ${fileName}`);
    await nodeRepository.save(fileName, md);
}

async function handleChange() {
    await save();
}

</script>

<div>
    <textarea on:change={handleChange} bind:value={md}></textarea>
</div>

<style>
</style>

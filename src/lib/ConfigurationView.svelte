<script lang="ts">
    // https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/autostart/README.md
    import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
    import { onMount } from 'svelte';

    let isEnabledState: boolean = false;

    onMount(async () => {
        isEnabledState = await isEnabled();
    });

    async function disableAutoStart() {
        await disable();
        isEnabledState = await isEnabled();
    }

    async function enableAutoStart() {
        await enable();
        isEnabledState = await isEnabled();
    }
</script>

<div>
    <h1>Configuration</h1>

    <h2>Application auto startup</h2>
    {#if isEnabledState}
        <div>Current state: Enabled</div>
        <button on:click={disableAutoStart}>Disable</button>
    {:else}
        <div>Current state: Disabled</div>
        <button on:click={enableAutoStart}>Enable</button>
    {/if}
</div>

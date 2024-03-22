<script lang="ts">
    // https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/autostart/README.md
    import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
    import { onMount } from 'svelte';
    import { invoke } from '@tauri-apps/api/core';

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

    let openaiToken = '';
    onMount(async () => {
        openaiToken = await invoke('get_openai_token');
    });
    $: invoke('set_openai_token', { openaiToken });
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

    <div>
        <h2>OpenAI</h2>
        <input type="text" bind:value={openaiToken} />
    </div>
</div>

<script lang="ts">
    // https://github.com/tauri-apps/plugins-workspace/blob/v2/plugins/autostart/README.md
    import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
    import { onMount } from 'svelte';
    import { invoke } from '@tauri-apps/api/core';
    import { openaiTokenStore, promptsStore } from '../../Stores';
    import type { Prompt } from '../openai/Prompt';

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
    $: if (openaiToken.length > 0) {
        invoke('set_openai_token', { openaiToken });
        openaiTokenStore.set(openaiToken);
    }

    let prompts: Prompt[] = [];
    onMount(async () => {
        prompts = await invoke('get_openai_prompts');
    });
    $: if (prompts.length > 0) {
        invoke('set_openai_prompts', { prompts });
        promptsStore.set(prompts);
    }

    function addNewPrompt() {
        prompts = [...prompts, { title: '', prompt: '' }];
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

    <div>
        <h2>OpenAI</h2>
        <input type="text" bind:value={openaiToken} />
    </div>

    {#if prompts.length > 0}
        <h2>OpenAI Prompts</h2>
        <div class="form-container">
            <ul>
                {#each prompts as prompt, i}
                    <li>
                        <button class="remove-prompt">Remove prompt</button>
                        <label for={'title-' + i}>Title:</label>
                        <input type="text" bind:value={prompt.title} />
                        <label for={'prompt-' + i}>Prompt:</label>
                        <textarea bind:value={prompt.prompt}></textarea>
                    </li>
                {/each}
            </ul>
            <button on:click={() => addNewPrompt()}>Add new prompt</button>
        </div>
    {/if}
</div>

<style>
    section,
    article {
        margin-bottom: 20px;
    }

    input[type='text'],
    textarea {
        width: 100%;
        padding: 8px;
        margin-top: 5px;
        margin-bottom: 15px;
        box-sizing: border-box;
    }

    label {
        display: block;
        font-weight: bold;
    }

    button {
        padding: 10px 20px;
        cursor: pointer;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    li {
        border-bottom: orangered 1px solid;
    }

    .remove-prompt {
        background-color: green;
        color: white;
        border: none;
        padding: 5px;
        cursor: pointer;
    }

    .form-container {
        margin-left: 17px;
    }
</style>

<script lang="ts">
    // OpenAI の API をコールする。
    import { invoke } from '@tauri-apps/api/core';
    import { openaiTokenStore, promptsStore } from '../../Stores';
    import type { FileItem } from '../file_item/FileItem';
    import { v4 as uuidv4 } from 'uuid';
    import type { Prompt } from './Prompt';

    export let selectedItem: FileItem | undefined = undefined;

    let prompts: Prompt[] = [];
    promptsStore.subscribe((value) => {
        prompts = value;
    });

    let openaiToken: string | undefined = undefined;
    openaiTokenStore.subscribe((value) => {
        openaiToken = value;
    });

    let result: string | undefined = undefined;
    async function callOpenAI(prompt: Prompt) {
        if (openaiToken !== undefined) {
            result = 'Loading...';
            console.log(openaiToken, prompt.prompt, selectedItem.content);
            const uuid = uuidv4();
            console.log(uuid);
            const interval = setInterval(async () => {
                result = await invoke('tauri_get_openai_progress', {
                    uuid: uuid,
                });
            }, 300);
            result = await invoke('tauri_ask_openai', {
                uuid: uuid,
                openaiToken: openaiToken,
                prompt: prompt.prompt,
                note: selectedItem.content,
            });
            clearInterval(interval);
        } else {
            console.log('Missing OpenAI token.');
        }
    }
</script>

<div>
    <div>
        {#each prompts as prompt}
            <button on:click={async () => await callOpenAI(prompt)}
                >{prompt.title}</button
            >
        {/each}
    </div>
    {#if result}
        <pre>{result}</pre>
    {/if}
</div>

<style>
    button {
        margin: 10px;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #2f4f4f;
        font-size: 120%;
        cursor: pointer;
    }
    pre {
        margin-left: 17px;
        margin-right: 17px;
        white-space: pre-wrap;
        word-break: break-all;
    }
</style>

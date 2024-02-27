<script lang="ts">
    // language=Markdown
    import { marked } from 'marked';
    import { onMount } from 'svelte';
    import { invoke } from '@tauri-apps/api/core';

    const markdownContent = `
# NeoJot

## What's this?

NeoJot is the note-taking application written in TypeScript on Tauri.
You can use <a href="https://en.wikipedia.org/wiki/Markdown">Markdown</a> for writing your notes.

## Task management

NeoJot supports <a href="https://kaorahi.github.io/howm/index.html" target="_blank">howm</a> style task management feature.

    [2003-11-27]@ schedule
    [2003-11-27]- note
    [2003-11-27]+ todo
    [2003-11-27]! deadline
    [2003-11-27]. completed

`;

    let htmlContent: string | Promise<string> = '';
    $: htmlContent = marked(markdownContent);

    onMount(() => {
        const container = document.querySelector('.container');
        container.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'A' && target.getAttribute('href')) {
                event.preventDefault();
                await invoke('open_url', { url: target.getAttribute('href') });
            }
        });
    });
</script>

<div class="container">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html htmlContent}
</div>

<style>
    .container {
        padding: 9px;
    }
</style>

<script lang="ts">
    // language=Markdown
    import { marked } from 'marked';
    import { onMount } from 'svelte';
    import { invoke } from '@tauri-apps/api/core';

    let markdownContent = `# Loading...`;

    let htmlContent: string | Promise<string> = '';
    $: htmlContent = marked(markdownContent);

    onMount(async () => {
        markdownContent = await (await fetch('/assets/manual.md')).text();

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

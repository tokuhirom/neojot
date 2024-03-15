<script lang="ts">
    // language=Markdown
    import { marked } from 'marked';
    import { onMount } from 'svelte';
    import { invoke } from '@tauri-apps/api/core';

    const markdownContent = `
# NeoJot User Guide

## Introduction

NeoJot is a cutting-edge note-taking application developed in TypeScript using the Tauri framework. It integrates Markdown, allowing for efficient formatting of notes to enhance productivity and creativity.

## Getting Started with NeoJot

### Why Use NeoJot?

NeoJot encourages linking notes to foster connections between ideas, expand knowledge, and streamline information retrieval. This strategy is recommended to maximize the benefits of NeoJot, though users are free to adapt their usage to personal preferences.

### Creating and Linking Notes

#### Link Notes for Enhanced Connectivity

- **Alias**: Use the syntax \`ALIAS: NoteTitle\` to link all instances of "NoteTitle" within your notes, facilitating easy navigation.

- **Wiki-Style Links**: \`[[NoteTitle]]\` creates or links to a note with the title "NoteTitle".

## Task Management

NeoJot also offers basic task management features to keep your tasks organized.

### Creating Tasks

Initiate a task with **Command-T** and input details as follows:

\`\`\`
TODO[Scheduled:YYYY-MM-DD]: Task Title
\`\`\`

#### Customizing Tasks

- **Insert Scheduled Date**: Press 's' on "TODO" to insert a scheduled date, allowing you to easily set a start date for the task.
- **Add a Deadline**: 'd' on "TODO" to specify a deadline.
- **Start a Task**: 'i' on "TODO" to change its status to "DOING".
- **Complete a Task**: 'Enter' on "DOING" to mark as "DONE".
- **Cancel a Task**: 'c' on "DOING" to mark as "CANCELLED".
- **Note Conversion**: 'n' on "TODO" to demote it to "NOTE".

### Task Scoring System

Tasks are prioritized based on a scoring system to ensure important tasks are highlighted:

- **Positive Scores**: Indicate tasks due soon or currently in progress.
- **Negative Scores**: Completed or cancelled tasks receive negative scores to deprioritize them.
- **Task Visibility**: Tasks with positive scores are shown prominently, directing focus to immediate priorities.

#### Detailed Scoring Logic

- **TODO**: Positive score if deadline is within 3 days or scheduled date is within 1 day.
- **PLAN**: Positive score if scheduled date is within 3 days.
- **DOING**: Always positive.
- **CANCELED, COMPLETED, DONE**: Always negative.
- **NOTE**: Positive if scheduled date is within 1 day.

Tasks with a positive score are deemed important and are displayed at the top of the task list, ensuring you always know what needs attention.

## Special Markdown Features

### Images

Insert images using the following syntax:

- \`![Alt Text](File path or URL)\`
- \`![[image.png|100]]\` - Display the image, with width to 100px.
- \`![[image.png|100x200]]\` - Display the image width as 100px x 200px.

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

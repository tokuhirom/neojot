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

## Note taking strategy

There's a NeoJot's note taking strategy.
Of course, you can ignore following rules, but the author recommend it!

### Link notes!

If you link the notes, you get more ideas, knowledge, and information.

#### Come-From link

You can write the following style:

    <<< Emacs

After that, when you write a word 'Emacs' in your note, all words are linked to this note!

When you click this link, you can go to the note about Emacs.

#### Go-To link

You can write the following style:

    >>> Emacs

You can quickly search the note about Emacs.

(Not implemented yet)

### Wiki sytle link

You can create the link to the note by the following style:

    [[Emacs]]

It links to the note that has 'Emacs' title.
On click the link, you can go to the note about Emacs.

If there's no note about 'Emacs', NeoJot creates notes has a title 'Emacs' automatically.

## Task management

NeoJot supports basic task management features.

At first, you type **Command-T** to create a new task on the editor.
Then, you got the following line:

    TODO[Scheduled:2024-03-02(Sat)]:

After that, type the title of the task.

    TODO[Scheduled:2024-03-02(Sat)]: Write a document about NeoJot

You can also add a deadline to the task. Type 'd' on the word 'TODO'.
Then you got ta following line:

    TODO[Deadline:2024-03-02(Sat) Scheduled:2024-03-05(Tue)]:  Write a document about NeoJot

When you start the task, type 'i' on the word 'TODO'.
Then you got the following line:

    DOING[Deadline:2024-03-02(Sat) Scheduled:2024-03-05(Tue)]:  Write a document about NeoJot

When you finish the task, type 'd' on the word 'DOING'.
Then you got the following line:

    DOING[Deadline:2024-03-02(Sat) Scheduled:2024-03-05(Tue)]:  Write a document about NeoJot

When you finish the task, type 'Enter' on the word 'DOING'.
Then you got the following line:

    DONE[Finished:2024-03-02(Sat) Deadline:2024-03-02(Sat) Scheduled:2024-03-05(Tue)]:  Write a document about NeoJot

If you cancel the task, type 'c' on the word 'DOING'.
Then you got the following line:

    CANCEL[Finished:2024-03-02(Sat) Deadline:2024-03-02(Sat) Scheduled:2024-03-05(Tue)]:  Write a document about NeoJot

If the task is not so important, and it's just a note, you can type 'n' on the word 'TODO'.
Then you got the following line:

    NOTE[Deadline:2024-03-02(Sat) Scheduled:2024-03-05(Tue)]:  Write a document about NeoJot

### Behaviour of the task management

NeoJot provide the score for each task.
If the score is negative, the task is not so important. As a result, these tasks are displayed in the bottom of the task list.
If the score is positive, the task is important. As a result, these tasks are displayed in the top of the task list.
NeoJot shows only tasks, that have the score more than 0  on ListView.
NeoJot shows all tasks on the TaskView.

The score is calculated by the following logic:

- TODO type
    - If the task has deadline, task score is positive if since the deadline before 3 days.
    - If the task has scheduled date, task score is positive if since the scheduled date before 1 day.
- PLAN type
    - If the task has scheduled date, task score is positive if since the scheduled date before 3 days.
- DOING type
    - Task score is always positive.
- CANCELED, COMPLETED, DONE type
    - Task score is always negative.
- NOTE type
    - If the task has scheduled date, task score is positive if since the scheduled date before 1 day.

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

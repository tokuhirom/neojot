<script lang="ts">
    import { onMount } from 'svelte';
    import { type FileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';
    import { format } from 'date-fns';
    import {
        calculateFreshness,
        extractTasks,
        sortTasks,
        type Task,
    } from '../task/Task';
    import { emit } from '@tauri-apps/api/event';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';

    let searchWord = '';

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (FileItem) => void;
    export let title2fileItem: Record<string, FileItem>;
    export let comefromLinks: Record<string, FileItem>;
    let tasks: Task[] = [];
    let filteredTasks: Task[] = [];

    onMount(() => {
        tasks = sortTasks(extractTasks(dataFileItems));
        if (tasks.length > 0) {
            selectedItem = tasks[0].fileItem;
        }
    });

    $: if (dataFileItems) {
        tasks = sortTasks(extractTasks(dataFileItems));
    }

    $: if (searchWord === '') {
        filteredTasks = tasks;
    } else {
        filteredTasks = tasks.filter((task) => {
            return task.title.toLowerCase().includes(searchWord.toLowerCase());
        });
    }

    function onSaved() {
        selectedItem = selectedItem;
    }

    function onCreateItem(fileItem: FileItem) {
        dataFileItems.unshift(fileItem);
        allFileItems.unshift(fileItem);
        dataFileItems = dataFileItems;
        allFileItems = allFileItems;
        onSelectItem(fileItem);
    }

    function determineClass(task) {
        const now = new Date();
        const score = calculateFreshness(task, now);

        const typeClass = task.type.toLowerCase();
        return typeClass + ' ' + (score < 0 ? 'negative' : 'positive');
    }

    function handleOnClick(task: Task) {
        onSelectItem(task.fileItem);
        emit('go-to-line-number', task.lineNumber);
    }
</script>

<div class="task-view">
    <div class="file-list">
        <ClearableSearchBox bind:searchWord />
        {#each filteredTasks as task}
            <button
                on:click={() => handleOnClick(task)}
                class={determineClass(task)}
            >
                <span class="header">
                    {#if task.deadline}
                        <span class="deadline"
                            >Deadline: {format(
                                task.deadline,
                                'yyyy-MM-dd',
                            )}</span
                        >
                    {/if}
                    {#if task.scheduled}
                        <span class="scheduled"
                            >Scheduled: {format(
                                task.scheduled,
                                'yyyy-MM-dd',
                            )}</span
                        >
                    {/if}
                    <span class="task">{task.type} </span>
                </span>
                <span class="title">{task.title}</span>
                <span class="file-title">{task.fileItem.title}</span>
            </button>
        {/each}
    </div>
    <div class="log-view">
        {#if selectedItem !== undefined}
            <EntryView
                file={selectedItem}
                {allFileItems}
                {onSelectItem}
                {onSaved}
                {onCreateItem}
                {title2fileItem}
                {comefromLinks}
                search={() => {}}
            />
            <LinkCards
                file={selectedItem}
                {allFileItems}
                {onSelectItem}
                {onCreateItem}
            />
        {/if}
    </div>
</div>

<style>
    .task-view {
        display: flex; /* Enables Flexbox */
        flex-direction: row; /* Stack children vertically */
        height: 100vh;
        padding-left: 8px;
        padding-right: 8px;
    }
    .file-list {
        flex: 0 0 250px;
        height: 100vh;
        overflow-y: auto;
        padding-right: 9px;
        padding-left: 4px;
        overflow-x: hidden;
        word-break: break-word;
        white-space: normal;
    }
    .file-list button {
        display: block;
        word-break: break-all;
        width: 100%;
        text-align: left;
        background: none;
        color: inherit;
        border: none;
        padding: 8px;
        margin: 0;
        font: inherit;
        cursor: pointer;
        border-bottom: darkslategrey 1px solid;
        overflow-x: hidden;
    }
    .log-view {
        flex: 0 0 68%;
        /*overflow-x: hidden;*/
        padding-inline-start: 0;
        flex-grow: 1;
        margin-block-start: 0;
        margin-block-end: 0;
        height: 100vh;
        overflow-y: scroll;
    }

    .header {
        display: block;
    }
    .title {
        display: block;
    }
    .file-title {
        display: block;
        font-size: 80%;
    }

    /* 完了済みタスク */
    .done {
        color: #757575 !important;
        text-decoration: line-through;
        background-color: #f0f0f0;
    }

    .positive {
        background-color: darkslategrey !important;
    }

    .schedule {
        color: orange !important;
        display: block;
    }
    .deadline {
        color: crimson !important;
        display: block;
    }
    .todo {
        color: cornflowerblue !important;
    }
</style>

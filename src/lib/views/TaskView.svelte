<script lang="ts">
    import { onMount } from 'svelte';
    import { type FileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';
    import { extractTasks, sortTasks, type Task } from '../task/Task';
    import { emit } from '@tauri-apps/api/event';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';
    import TaskItem from '../task/TaskItem.svelte';

    let searchWord = '';

    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (FileItem) => void;
    export let pageTitles: string[];
    export let findEntryByTitle: (title: string) => FileItem | undefined;
    export let autoLinks: string[];
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
        dataFileItems = dataFileItems;
        onSelectItem(fileItem);
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
            <TaskItem {task} {handleOnClick} fullSize="true" />
        {/each}
    </div>
    <div class="log-view">
        {#if selectedItem !== undefined}
            <EntryView
                file={selectedItem}
                {onSelectItem}
                {onSaved}
                {onCreateItem}
                {pageTitles}
                search={() => {}}
                {findEntryByTitle}
                {autoLinks}
            />
            <LinkCards file={selectedItem} {onSelectItem} {onCreateItem} />
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
</style>

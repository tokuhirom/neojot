<script lang="ts">
    import { type FileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import { type Task } from '../task/Task';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';
    import TaskItem from '../task/TaskItem.svelte';
    import { searchKeywordStore, tasksStore } from '../../Stores';

    export let selectedItem: FileItem | undefined = undefined;
    export let pageTitles: string[];
    export let findEntryByTitle: (title: string) => FileItem | undefined;
    export let autoLinks: string[];

    let tasks: Task[] = [];
    let filteredTasks: Task[] = [];

    tasksStore.subscribe((value) => {
        tasks = value;
        if (selectedItem === undefined && tasks.length > 0) {
            selectedItem = tasks[0].fileItem;
        }
    });

    $: if ($searchKeywordStore === '') {
        filteredTasks = tasks;
    } else {
        filteredTasks = tasks.filter((task) => {
            return task.title
                .toLowerCase()
                .includes($searchKeywordStore.toLowerCase());
        });
    }
</script>

<div class="task-view">
    <div class="file-list">
        <ClearableSearchBox />
        {#each filteredTasks as task}
            <TaskItem {task} fullSize="true" />
        {/each}
    </div>
    <div class="log-view">
        {#if selectedItem !== undefined}
            <EntryView
                file={selectedItem}
                {pageTitles}
                search={() => {}}
                {findEntryByTitle}
                {autoLinks}
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

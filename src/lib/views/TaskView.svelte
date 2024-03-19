<script lang="ts">
    import { type FileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import { type Task } from '../task/Task';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';
    import TaskItem from '../task/TaskItem.svelte';
    import {
        searchKeywordStore,
        selectedItemStore,
        tasksStore,
    } from '../../Stores';

    export let pageTitles: string[];
    export let findEntryByTitle: (title: string) => FileItem | undefined;
    export let autoLinks: string[];

    let selectedItem: FileItem | undefined = undefined;
    selectedItemStore.subscribe((value) => {
        selectedItem = value;
    });

    let tasks: Task[] = [];
    let filteredTasks: Task[] = [];

    tasksStore.subscribe((value: Task[]) => {
        tasks = value
            .filter((task) => shouldShowTask(task))
            .sort((a, b) => taskScore(a) - taskScore(b));
        if (selectedItem === undefined && tasks.length > 0) {
            $selectedItemStore = tasks[0].fileItem;
        }
    });

    function shouldShowTask(task: Task) {
        if (task.type == 'DONE' || task.type == 'CANCELED') {
            return false;
        }

        if (task.type == 'PLAN' && task.scheduled != null) {
            if (task.scheduled < new Date()) {
                return false;
            }
        }

        return true;
    }

    // lower score should be shown first
    function taskScore(task: Task): number {
        let score: number = Infinity;
        if (task.scheduled != null) {
            score = task.scheduled.getTime();
        }
        if (task.deadline != null) {
            if (task.scheduled != null) {
                score = Math.min(score, task.deadline.getTime());
            } else {
                score = task.deadline.getTime();
            }
        }
        return score;
    }

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
        flex: 0 0 30%;
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

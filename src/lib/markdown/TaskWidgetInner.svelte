<script lang="ts">
    import {
        calculateFreshness,
        extractTasks,
        getTaskIcon,
        sortTasks,
        type Task,
    } from '../task/Task';
    import type { FileItem } from '../file_item/FileItem';

    export let onClick: (task: Task) => void;
    export let dataFileItems: FileItem[];

    let tasks: Task[];

    $: if (dataFileItems) {
        const today = new Date();
        tasks = sortTasks(extractTasks(dataFileItems)).filter((task) => {
            return calculateFreshness(task, today) >= 0;
        });
    }
</script>

<div>
    {#each tasks as task}
        <button on:click={() => onClick(task)}>
            {getTaskIcon(task)}
            {task.title}
        </button>
    {/each}
</div>

<script lang="ts">
    import {
        calculateFreshness,
        extractTasks,
        getTaskIcon,
        sortTasks,
        type Task,
    } from '../task/Task';
    import type { FileItem } from '../file_item/FileItem';
    import { format } from 'date-fns';

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
            {#if task.type === 'PLAN' && task.scheduled}
                {format(task.scheduled, 'yyyy-MM-dd')}
            {/if}
            {#if task.deadline}
                <span class="deadline"
                    >{format(task.deadline, 'yyyy-MM-dd')}</span
                >
            {/if}
            {task.title}
        </button>
    {/each}
</div>

<style>
    button {
        display: block;
        text-align: left;
        align-items: center;
        margin: 3px;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        width: 100%;
    }

    button:hover {
        background-color: #2f4f4f;
    }
    .deadline {
        color: orangered;
    }
</style>

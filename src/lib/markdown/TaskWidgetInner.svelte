<script lang="ts">
    import {
        calculateFreshness,
        getTaskIcon,
        openTask,
        type Task,
    } from '../task/Task';
    import { format } from 'date-fns';

    export let tasks: Task[];
    let filteredTasks: Task[];
    $: {
        filteredTasks = tasks.filter((task) => {
            return calculateFreshness(task, new Date()) >= 0;
        });
    }
</script>

<div>
    {#each filteredTasks as task}
        <button on:click={async () => await openTask(task)}>
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
        font-size: 80%;
    }

    button:hover {
        background-color: #2f4f4f;
    }
    .deadline {
        color: orangered;
    }
</style>

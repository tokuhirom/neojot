<script lang="ts">
    import { getTaskIcon, openTask, type Task } from '../task/Task';
    import { format } from 'date-fns';
    import type { DateTasks } from './TaskPlugin';

    export let doing: Task[];
    export let dateTasks: DateTasks[];
</script>

<div>
    {#each doing as task}
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
    {#each dateTasks as dateTask}
        <div class="date">{dateTask.date}</div>
        {#each dateTask.tasks as task}
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

    .date {
        font-size: 89%;
    }
</style>

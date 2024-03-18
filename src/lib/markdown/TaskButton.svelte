<script lang="ts">
    import { getTaskIcon, openTask } from '../task/Task.js';
    import { format } from 'date-fns';
    import { type Task } from '../task/Task';

    export let task: Task;
</script>

<button on:click={async () => await openTask(task)}>
    {getTaskIcon(task)}
    {#if task.type === 'PLAN' && task.scheduled}
        {format(task.scheduled, 'yyyy-MM-dd')}
    {/if}
    {#if task.deadline}
        <span class="deadline">{format(task.deadline, 'yyyy-MM-dd')}</span>
    {/if}
    {task.title}
</button>

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

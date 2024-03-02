<script lang="ts">
    import { format } from 'date-fns';
    import { calculateFreshness, type Task } from './Task';
    import TaskIcon from './TaskIcon.svelte';

    export let task: Task;
    export let handleOnClick: (task: Task) => void;

    function determineClass(task: Task) {
        const now = new Date();
        const score = calculateFreshness(task, now);

        const typeClass = task.type.toLowerCase();
        return typeClass + ' ' + (score < 0 ? 'negative' : 'positive');
    }
</script>

<button on:click={() => handleOnClick(task)} class={determineClass(task)}>
    <span class="header">
        <TaskIcon {task} />
        <span class="task">{task.type} </span>
    </span>
    <span class="title">{task.title}</span>
    {#if task.deadline}
        <span class="deadline"
            >Deadline: {format(task.deadline, 'yyyy-MM-dd')}</span
        >
    {/if}
    {#if task.scheduled}
        <span class="scheduled"
            >Scheduled: {format(task.scheduled, 'yyyy-MM-dd')}</span
        >
    {/if}
    <span class="file-title">{task.fileItem.title}</span>
</button>

<style>
    button {
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

<script lang="ts">
    import { format } from 'date-fns';
    import { calculateFreshness, type Task } from './Task';
    import TaskIcon from './TaskIcon.svelte';
    import { selectedItemStore } from '../../Stores';
    import { emit } from '@tauri-apps/api/event';

    export let task: Task;
    export let fullSize: boolean = false;

    function handleOnClick(task: Task) {
        $selectedItemStore = task.fileItem;
        emit('go-to-line-number', task.lineNumber);
    }

    function determineClass(task: Task) {
        const now = new Date();
        const score = calculateFreshness(task, now);

        const typeClass = task.type.toLowerCase();
        return typeClass + ' ' + (score > 0 ? 'positive' : 'negative');
    }
</script>

<button on:click={() => handleOnClick(task)} class={determineClass(task)}>
    <span class="header">
        <TaskIcon {task} />
        <span class="task">{task.type} </span>
    </span>
    <span class="title">
        {#if task.scheduled && task.type === 'PLAN'}
            {format(task.scheduled, 'yyyy-MM-dd(EEE)')}
        {/if}
        {task.title}</span
    >
    {#if fullSize}
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
    {/if}
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
    }

    .schedule {
        color: orange !important;
        display: block;
    }
    .deadline {
        display: block;
    }
    .positive .deadline {
        color: crimson !important;
        display: block;
    }
    .todo {
        color: midnightblue !important;
    }

    .positive.plan {
        background-color: #f0f0f0 !important;
        color: black;
    }
    .positive.doing {
        background-color: bisque !important;
        color: black;
    }
    .positive.todo {
        background-color: bisque !important;
        color: black;
    }
    .negative {
        background-color: #a9a9a9 !important;
        color: black;
    }
</style>

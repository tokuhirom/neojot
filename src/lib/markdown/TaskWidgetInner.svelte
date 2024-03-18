<script lang="ts">
    import { type Task } from '../task/Task';
    import type { DateTasks } from './TaskPlugin';
    import TaskButton from './TaskButton.svelte';

    export let doing: Task[];
    export let dateTasks: DateTasks[];
</script>

<div>
    {#each doing as task}
        <TaskButton {task} />
    {/each}
    {#each dateTasks as dateTask}
        <div class="date">{dateTask.date}</div>
        {#each dateTask.tasks as task}<TaskButton {task} />{/each}
    {/each}
</div>

<style>
    .date {
        font-size: 89%;
    }
</style>

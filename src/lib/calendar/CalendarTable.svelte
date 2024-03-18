<script lang="ts">
    import { type CalendarDay, generateCalendar } from './calendar-utils.ts';
    import { onMount } from 'svelte';
    import type { FileItem } from '../file_item/FileItem';
    import { getTaskIcon, type Task } from '../task/Task';
    import { emit } from '@tauri-apps/api/event';
    import { selectedItemStore, tasksStore } from '../../Stores';

    export let year: number;
    export let month: number;

    let calendars: CalendarDay[][] = [];

    onMount(async () => {
        calendars = generateCalendar(year, month);
    });

    $: if (year && month) {
        calendars = generateCalendar(year, month);
    }

    let tasks: Task[] = [];
    tasksStore.subscribe((value) => {
        tasks = value;
    });

    let taskMap: Map<number, Task[]> = new Map();
    $: if (year && month) {
        const filteredTasks = tasks
            .filter(
                (task) =>
                    (task.scheduled &&
                        task.scheduled.getFullYear() === year &&
                        task.scheduled.getMonth() + 1 === month) ||
                    (task.deadline &&
                        task.deadline.getFullYear() === year &&
                        task.deadline.getMonth() + 1 === month) ||
                    (task.finished &&
                        task.finished.getFullYear() === year &&
                        task.finished.getMonth() + 1 === month),
            )
            .toSorted((a, b) => a.type.localeCompare(b.type));

        // insert tasks into taskMap.
        // the key is the day of month.
        const newTaskMap = new Map<number, Task[]>();
        filteredTasks.forEach((task) => {
            // at first, if task.scheduled, use it.
            // after that, if task.deadline, use it.
            for (const date of [task.finished, task.scheduled, task.deadline]) {
                if (date) {
                    const day = date.getDate();
                    if (!newTaskMap.has(day)) {
                        newTaskMap.set(day, []);
                    }
                    newTaskMap.get(day).push(task);
                    break;
                }
            }
        });
        // sort tasks in each day.
        // the key is the day of month.
        // sort key is the type of task.
        // task type is 'PLAN', 'DOING', 'WAITING', 'DONE', 'CANCELED'.
        // Sort tasks by this order.
        const taskTypeOrder = {
            PLAN: 0,
            DOING: 1,
            WAITING: 2,
            DONE: 3,
            CANCELED: 4,
        };
        newTaskMap.forEach((tasks) => {
            tasks.sort((a, b) => taskTypeOrder[a.type] - taskTypeOrder[b.type]);
        });
        taskMap = newTaskMap;
    }

    function getDayClass(day) {
        if (!day.date) return '';
        const dayOfWeek = day.date.getDay();
        if (dayOfWeek === 0) return 'sunday';
        if (dayOfWeek === 6) return 'saturday';
        return '';
    }

    function handleTaskOnClick(task: Task) {
        selectedItemStore.set(task.fileItem);
        emit('go-to-line-number', task.lineNumber);
    }
</script>

<div>
    <table>
        {#each calendars as week}
            <tr>
                {#each week as day}
                    <td class="day-cell">
                        {#if day.day !== null}
                            <div class={getDayClass(day)}>
                                {day.day}
                            </div>
                            {#if taskMap}
                                {#each taskMap.get(day.day) || [] as task}
                                    <button
                                        on:click={() => handleTaskOnClick(task)}
                                        class={task.type.toLowerCase()}
                                    >
                                        <span class="icon"
                                            >{getTaskIcon(task)}</span
                                        >
                                        {task.title}
                                    </button>
                                {/each}
                            {/if}
                        {/if}
                    </td>
                {/each}
            </tr>
        {/each}
    </table>
</div>

<style>
    table {
        width: 100%; /* テーブル幅を最大に */
        border-collapse: collapse; /* セル間の境界線をまとめる */
    }

    tr {
        height: auto; /* 行の高さを自動調整 */
    }

    td {
        vertical-align: top; /* コンテンツを上揃えに */
    }

    .sunday {
        color: orangered;
    }
    .saturday {
        color: #535bf2;
    }

    .day-cell {
        width: 10%;
    }
    .day {
        word-break: normal;
        white-space: nowrap;
    }

    button {
        text-align: left;
        word-break: break-all;
        min-width: 50px;
        width: 100%;

        background: none;
        color: inherit;
        padding: 8px;
        margin: 0;
        cursor: pointer;
        border: darkslategrey 1px solid;
    }

    .canceled {
        filter: grayscale(100%);
        opacity: 0.4;
    }
</style>

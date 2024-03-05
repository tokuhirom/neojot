<script lang="ts">
    import { type CalendarDay, generateCalendar } from './calendar-utils.ts';
    import { type CalendarData } from '../repository/NodeRepository';
    import { onMount } from 'svelte';
    import type { FileItem } from '../file_item/FileItem';
    import { extractTasks, type Task } from '../task/Task';
    import { emit } from '@tauri-apps/api/event';
    import { invoke } from '@tauri-apps/api/core';

    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let allFileItems: FileItem[] = [];

    export let year: number;
    export let month: number;

    let calendars: CalendarDay[][] = [];
    let calendarData: CalendarData | undefined = undefined;
    let fileMap: Record<string, FileItem> = {};

    onMount(async () => {
        calendars = generateCalendar(year, month);
        loadCalendarMap();
        await reloadFiles();
    });

    $: if (year && month) {
        calendars = generateCalendar(year, month);
        loadCalendarMap();
        reloadFiles();
    }

    function loadCalendarMap() {
        invoke('tauri_get_commits_by_day', {
            year,
            month,
        }).then((res) => {
            const calendarMap = res as Record<number, string[]>;
            calendarData = calendarMap;
            console.log(calendarMap);
        });
    }

    let taskMap: Map<number, Task[]> = new Map();
    $: if (year && month) {
        const tasks = extractTasks(allFileItems)
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
        tasks.forEach((task) => {
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
        taskMap = newTaskMap;
    }

    async function reloadFiles() {
        let newFileMap: Record<string, FileItem> = {};
        for (let fileItem of allFileItems) {
            newFileMap[fileItem.filename.replace(/.+\//, '')] = fileItem;
        }
        fileMap = newFileMap;
    }

    function getDayClass(day) {
        if (!day.date) return '';
        const dayOfWeek = day.date.getDay();
        if (dayOfWeek === 0) return 'sunday';
        if (dayOfWeek === 6) return 'saturday';
        return '';
    }

    function handleTaskOnClick(task: Task) {
        onSelectItem(task.fileItem);
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
                                        >{#if task.type === 'PLAN'}📅{:else if task.finished && task.finished.getDate() === day.day}✅{:else if task.deadline && task.deadline.getDate() === day.day}🚨{:else if task.scheduled && task.scheduled.getDate() === day.day}💪{/if}
                                        {task.title}
                                    </button>
                                {/each}
                            {/if}
                            {#if calendarData}
                                {#each calendarData[day.day] || [] as filename}
                                    {#if fileMap[filename]}
                                        <button
                                            on:click={() =>
                                                onSelectItem(fileMap[filename])}
                                        >
                                            {fileMap[filename].title}
                                        </button>
                                    {/if}
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
</style>

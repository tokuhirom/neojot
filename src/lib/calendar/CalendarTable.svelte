<script lang="ts">
    import { type CalendarDay, generateCalendar } from './calendar-utils.ts';
    import {
        type CalendarData,
        readCalendarFile,
    } from '../repository/NodeRepository';
    import { onMount } from 'svelte';
    import type { FileItem } from '../file_item/FileItem';

    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let allFileItems: FileItem[] = [];

    export let year: number;
    export let month: number;

    let calendars: CalendarDay[][] = [];
    let calendarData: CalendarData | undefined = undefined;
    let fileMap: Record<string, FileItem> = {};

    onMount(async () => {
        calendars = generateCalendar(year, month);
        calendarData = await readCalendarFile(year, month);
        await reloadFiles();
    });

    $: if (year && month) {
        calendars = generateCalendar(year, month);
        readCalendarFile(year, month).then((data) => {
            calendarData = data;
        });
        reloadFiles();
    }

    async function reloadFiles() {
        let newFileMap: Record<string, FileItem> = {};
        for (let fileItem of allFileItems) {
            newFileMap[fileItem.filename.replace(/.+\//, '')] = fileItem;
        }
        fileMap = newFileMap;
    }
</script>

<div>
    <h1>{year}</h1>
    {month}
    <table>
        {#each calendars as week}
            <tr>
                {#each week as day}
                    <td class="day-cell">
                        {#if day.day !== null}
                            <div
                                class="day {day.date && day.date.getDay() === 0
                                    ? 'sunday'
                                    : day.date && day.date.getDay() === 6
                                      ? 'saturday'
                                      : ''}"
                            >
                                {day.day}
                            </div>
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

<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import {
        archiveFile,
        type CalendarData,
        deleteArchivedFile,
        loadFileList,
        readCalendarFile,
    } from '../repository/NodeRepository';
    import type { FileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';
    import { listen, type UnlistenFn } from '@tauri-apps/api/event';

    let year: number;
    let month: number;
    let calendars: CalendarDay[][] = [];
    let calendarData: CalendarData | undefined = undefined;
    let fileMap: Record<string, FileItem> = {};

    let selectedItem: FileItem | undefined = undefined;

    let fileItems: FileItem[] = [];

    type CalendarDay = {
        day: number | null; // 日付、またはプレースホルダー用にnull
        date: Date | null; // 実際のDateオブジェクト、またはnull
    };

    function generateCalendar(year: number, month: number): CalendarDay[][] {
        // 指定された月の最初の日と最後の日を取得
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);

        // 月の最初の日が週の何日目か（0=日曜日、6=土曜日）
        const startWeekday = firstDayOfMonth.getDay();

        // 月の日数
        const numberOfDaysInMonth = lastDayOfMonth.getDate();

        // カレンダー配列を初期化
        const calendar: CalendarDay[][] = [];
        let week: CalendarDay[] = [];
        let dayCounter = 1;

        // 月の最初の日まで空白で埋める
        for (let i = 0; i < startWeekday; i++) {
            week.push({ day: null, date: null });
        }

        // 月の日数分ループして配列を埋める
        while (dayCounter <= numberOfDaysInMonth) {
            if (week.length === 7) {
                calendar.push(week);
                week = [];
            }
            week.push({
                day: dayCounter,
                date: new Date(year, month - 1, dayCounter),
            });
            dayCounter++;
        }

        // 最後の週が7日未満の場合、残りを空白で埋める
        while (week.length < 7) {
            week.push({ day: null, date: null });
        }
        calendar.push(week);

        return calendar;
    }

    onMount(async () => {
        const currentDate = new Date();
        year = currentDate.getFullYear();
        month = currentDate.getMonth() + 1;

        console.log('GENER');
        calendars = generateCalendar(year, month);

        calendarData = await readCalendarFile(year, month);
        await reloadFiles();
    });

    async function reloadFiles() {
        let newFileMap: Record<string, FileItem> = {};
        const dataFileList = await loadFileList('data');
        fileItems = dataFileList;
        for (let fileItem of dataFileList) {
            newFileMap[fileItem.filename.replace(/.+\//, '')] = fileItem;
        }
        const archivedFileList = await loadFileList('archived');
        for (let fileItem of archivedFileList) {
            newFileMap[fileItem.filename.replace(/.+\//, '')] = fileItem;
        }
        fileMap = newFileMap;
    }

    let unlistenCallbackPromises: Promise<UnlistenFn>[] = [];
    unlistenCallbackPromises.push(
        listen('do_archive', async () => {
            if (selectedItem) {
                if (selectedItem.filename.startsWith('archived/')) {
                    console.log(`Deleting: ${selectedItem.filename}`);
                    await deleteArchivedFile(selectedItem);
                    await reloadFiles();
                    selectedItem = fileItems[0];
                } else {
                    console.log(`Archiving: ${selectedItem.filename}`);
                    await archiveFile(selectedItem);
                    fileItems = await loadFileList('data');
                    selectedItem = fileItems[0];
                }
            }
        }),
    );
    onDestroy(async () => {
        for (let unlistenCallbackPromise of unlistenCallbackPromises) {
            (await unlistenCallbackPromise)();
        }
    });

    function openFile(fileItem: FileItem) {
        selectedItem = fileItem;
    }
</script>

<div class="calendar-view">
    <div class="calendar">
        {#if month}
            <h1>{year}-{month.toString().padStart(2, '0')}</h1>
        {/if}
        <table>
            {#each calendars as week}
                <tr>
                    {#each week as day}
                        <td class="day-cell">
                            {#if day.day !== null}
                                <div
                                    class="day {day.date &&
                                    day.date.getDay() === 0
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
                                                    openFile(fileMap[filename])}
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
    <div class="log-view">
        {#if selectedItem !== undefined}
            {#if selectedItem.filename.startsWith('archived/')}
                <div class="archived">Archived</div>
            {/if}
            <EntryView file={selectedItem} {fileItems} openEntry={openFile} />
            <LinkCards file={selectedItem} {fileItems} openEntry={openFile} />
        {/if}
    </div>
</div>

<style>
    .archived {
        margin: 8px;
        padding: 8px;
        border: orange;
        background-color: bisque;
        border-radius: 8px;
        color: #0f0f0f;
    }

    .calendar-view {
        display: flex; /* Enables Flexbox */
        flex-direction: row; /* Stack children vertically */
        height: 100vh;
        padding-left: 8px;
        padding-right: 8px;
    }
    .calendar {
        flex: 0 0 50%;
        overflow-y: auto;
        padding-right: 9px;
        padding-left: 4px;
        overflow-x: hidden;
        word-break: break-word;
        white-space: normal;
    }

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
    .log-view {
        flex: 0 0 58%;
        /*overflow-x: hidden;*/
        padding-inline-start: 0;
        flex-grow: 1;
        margin-block-start: 0;
        margin-block-end: 0;
    }
</style>
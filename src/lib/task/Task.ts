import type { FileItem } from '../file_item/FileItem';
import { differenceInDays, startOfDay } from 'date-fns';
import { parse as parseDate2 } from 'date-fns';
import { emit } from '@tauri-apps/api/event';
import { selectedItemStore } from '../../Stores';

export type Task = {
    type: 'TODO' | 'WAITING' | 'CANCELED' | 'DONE' | 'PLAN' | 'DOING' | 'NOTE';
    scheduled: Date | null;
    deadline: Date | null;
    finished: Date | null;
    title: string;
    lineNumber: number;
    fileItem: FileItem;
};

// 旬度を計算する関数
// 旬度はタスクタブと、通常表示の両方で使う。
// 重要なものがプラスに振り切る。マイナスは下の方に出る。
//
// リストタブには、0以上のものが表示される。
// タスクタブには全てが表示される
export function calculateFreshness(
    task: {
        type: string;
        deadline: Date | null;
        scheduled: Date | null;
    },
    today: Date,
): number {
    if (task.type === 'CANCELED' || task.type === 'DONE') {
        return -Infinity;
    }

    if (task.type === 'DOING') {
        return Infinity;
    }

    if (task.type == 'PLAN') {
        if (task.scheduled) {
            const diffDays = differenceInDays(task.scheduled, today);
            if (diffDays < 0) {
                return -Infinity;
            }
            return 80 - diffDays * 30;
        } else {
            return -Infinity; // without scheduled date, it's not a plan
        }
    }

    if (task.type == 'NOTE') {
        if (task.scheduled) {
            const diffDays = differenceInDays(task.scheduled, today);
            if (diffDays > 0) {
                return 0 - diffDays;
            }
            return 1 + diffDays;
        } else {
            return -Infinity; // without scheduled date, it's not a plan
        }
    }

    if (task.deadline) {
        const taskDate = new Date(task.deadline);
        const diffDays = differenceInDays(today, taskDate);
        return diffDays + 3;
    }

    if (task.scheduled) {
        const taskDate = new Date(task.scheduled);
        const diffDays = differenceInDays(today, taskDate);
        return diffDays + 1;
    }

    return 0;
}

export function parseTask(
    line: string,
    lineNumber: number,
    fileItem: FileItem,
): Task | undefined {
    const taskTypeRegex = /^(TODO|DONE|COMPLETED|CANCELED|PLAN|DOING|NOTE)/;
    const dateRegex =
        /((Scheduled|Deadline|Finished):(\d{4}-\d{2}-\d{2})\([A-Z][a-z][a-z]\))/g;

    const typeMatch = line.match(taskTypeRegex);
    if (!typeMatch) return;

    let scheduled: Date | null = null;
    let deadline: Date | null = null;
    let finished: Date | null = null;
    let match;

    while ((match = dateRegex.exec(line)) !== null) {
        const dateType = match[2];
        const dateStr = match[3];
        const parsedDate = parseDate2(dateStr, 'yyyy-MM-dd', new Date());

        if (dateType === 'Scheduled') {
            scheduled = parsedDate;
        } else if (dateType === 'Deadline') {
            deadline = parsedDate;
        } else if (dateType === 'Finished') {
            finished = parsedDate;
        }
    }

    const titleMatch = line.replace(/\[.*?]/, '').match(/:\s*(.+)$/);
    if (!titleMatch) return;

    const title = titleMatch[1];

    return {
        type: typeMatch[1],
        scheduled,
        deadline,
        finished,
        title,
        lineNumber,
        fileItem,
    };
}

export function extractTasks(fileItems: FileItem[]): Task[] {
    const tasks: Task[] = [];

    fileItems.forEach((fileItem) => {
        tasks.push(...cachedExtractTaskFromFileItem(fileItem));
    });

    return tasks;
}

// cache for the extracted tasks
type TaskCacheEntry = {
    tasks: Task[];
    mtime: number;
};
const taskCache = new Map<string, TaskCacheEntry>();
function cachedExtractTaskFromFileItem(fileItem: FileItem): Task[] {
    const mtime = fileItem.mtime;
    const cache = taskCache.get(fileItem.filename);
    if (cache && cache.mtime === mtime) {
        return cache.tasks;
    }
    const tasks = extractTaskFromFileItem(fileItem);
    taskCache.set(fileItem.filename, { tasks, mtime });
    return tasks;
}

function extractTaskFromFileItem(fileItem: FileItem): Task[] {
    return fileItem.content
        .split('\n')
        .map((line, index) => parseTask(line, index + 1, fileItem))
        .filter((it) => it) as Task[];
}

export function sortTasks(tasks: Task[]): Task[] {
    const today = new Date();
    tasks.sort(
        (a, b) => calculateFreshness(b, today) - calculateFreshness(a, today),
    );
    return tasks;
}

export function getTaskIcon(task: Task): string {
    const today = startOfDay(new Date());
    if (task.type === 'DONE') {
        return '✅';
    } else if (task.type === 'PLAN') {
        return '📅';
    } else if (task.type === 'DOING') {
        return '✍️';
    } else if (task.type === 'WAITING') {
        return '⏳';
    } else if (task.type === 'CANCELED') {
        return '❌';
    } else if (task.deadline && task.deadline.getDate() <= today.getDate()) {
        return '🚨';
    } else if (task.scheduled && task.scheduled.getDate() === today.getDate()) {
        return '💪';
    } else {
        return '📝';
    }
}

export async function openTask(task: Task) {
    selectedItemStore.set(task.fileItem);
    await emit('go-to-line-number', task.lineNumber);
}

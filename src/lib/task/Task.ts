import type { FileItem } from '../file_item/FileItem';
import { differenceInDays } from 'date-fns';
import { parse as parseDate2 } from 'date-fns';

export type Task = {
    type: string;
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
    if (
        task.type === 'COMPLETED' ||
        task.type === 'CANCELED' ||
        task.type === 'DONE'
    ) {
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
    const taskTypeRegex = /^(TODO|DONE|COMPLETED|CANCELED|PLAN|DOING)/;
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
        fileItem.content.split('\n').forEach((line, index) => {
            const taskP = parseTask(line, index + 1, fileItem);
            if (taskP) {
                console.log(taskP);
                tasks.push(taskP);
            }
        });
    });

    return tasks;
}

export function sortTasks(tasks: Task[]): Task[] {
    const today = new Date();
    tasks.sort(
        (a, b) => calculateFreshness(b, today) - calculateFreshness(a, today),
    );
    return tasks;
}

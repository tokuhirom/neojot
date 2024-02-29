import type { FileItem } from '../file_item/FileItem';
import { startOfDay } from 'date-fns';

export type Task = {
    date: Date;
    type: string;
    symbol: string; // TODO remove this
    duration: number;
    title: string;
    fileItem: FileItem;
};

// 旬度を計算する関数
// 旬度はタスクタブと、通常表示の両方で使う。
// 重要なものがプラスに振り切る。マイナスは下の方に出る。
//
// リストタブには、0以上のものが表示される。
// タスクタブには全てが表示される
export function calculateFreshness(
    task: { date: Date; symbol: string; duration: number },
    today: Date,
): number {
    const taskDate = new Date(task.date);
    const diffDays =
        (taskDate.getTime() - startOfDay(today).getTime()) / (1000 * 3600 * 24);
    let freshness = 0;

    switch (task.symbol) {
        case '@':
            // 予定は、直近3日程度の間表示されていれば良い。
            if (diffDays < 0) {
                freshness = -Infinity; // 過去の予定に興味なし
            } else if (diffDays < task.duration) {
                freshness = 0;
            } else {
                freshness = -diffDays;
            }
            break;
        case '+':
            // TODO: 指定日はscore 0。それ以後は 1ずつ増えていく
            if (diffDays < 0) {
                // 指定日より前は表示されないため、-Infinity
                freshness = -999;
            } else {
                // 指定日からスコアは0開始で、その後は日ごとに1ずつ増加
                freshness = diffDays;
            }
            break;
        case '!':
            // 〆切: 指定日の7日前から徐々に浮かび、指定日以降浮きっぱなし
            if (diffDays < -task.duration) {
                freshness = -999; // 期間前は表示されない
            } else {
                freshness = task.duration + diffDays; // 締切日以降は継続して増加
            }
            break;
        case '-':
            // 覚書: 指定日に浮かび上がり、以降1日かけて単位量だけ徐々に沈む
            // 覚書: 指定日にdurationのスコアがつき、以降duration日間スコアが減少
            if (diffDays >= 0) {
                // 指定日以後、duration日間、スコアは日ごとに減少
                freshness =
                    diffDays <= task.duration ? task.duration - diffDays : -999;
            } else {
                // 指定日以前は-Infinity
                freshness = -999;
            }
            break;
        case '.':
            // 済み: 常に底
            freshness = -Infinity;
            break;
    }

    return freshness;
}

export function parseDate(dateString: string): Date | null {
    const date = new Date(dateString);

    // Dateオブジェクトが有効かどうかをチェック
    if (!isNaN(date.getTime())) {
        // 有効なDateオブジェクトの場合
        return date;
    } else {
        // 無効なDateオブジェクトの場合（パース失敗）
        return null;
    }
}

export function extractTasks(fileItems: FileItem[]): Task[] {
    const tasks: Task[] = [];
    const newTypeRegex =
        /^(TODO|COMPLETED|CANCELED)(\[(((Finished|Scheduled|Deadline):(\d{4}-\d{2}-\d{2})\([A-Z][a-z][a-z]\)\s*)*)])?:\s*(.+)/;

    fileItems.forEach((fileItem) => {
        fileItem.content.split('\n').forEach((line) => {
            const match = line.match(newTypeRegex);
            if (match) {
                const toSymbol: Record<string, string> = {
                    TODO: '+',
                    COMPLETED: '.',
                    CANCELED: 'x',
                };

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const type = match[1];
                const date = match[6];
                const parsedDate = parseDate(date);
                if (!parsedDate) {
                    return;
                }

                tasks.push({
                    date: parsedDate,
                    type: type,
                    symbol: toSymbol[type] || '?',
                    duration: 3,
                    title: match[7],
                    fileItem,
                });
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

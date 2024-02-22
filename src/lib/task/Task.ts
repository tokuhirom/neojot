import type { FileItem } from '../file_item/FileItem';

export type Task = {
    date: Date;
    symbol: string;
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
        (taskDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    let freshness = 0;

    switch (task.symbol) {
        case '@':
            // 予定は、直近3日程度の間表示されていれば良い。
            {
                const isWithinDurationBeforeSchedule =
                    diffDays >= -task.duration && diffDays <= 0;
                freshness = isWithinDurationBeforeSchedule ? 0 : -Infinity;
            }
            break;
        case '+':
            // TODO: 指定日はscore 0。それ以後は 1ずつ増えていく
            if (diffDays < 0) {
                // 指定日より前は表示されないため、-Infinity
                freshness = -Infinity;
            } else {
                // 指定日からスコアは0開始で、その後は日ごとに1ずつ増加
                freshness = diffDays;
            }
            break;
        case '!':
            // 〆切: 指定日の7日前から徐々に浮かび、指定日以降浮きっぱなし
            if (diffDays < -task.duration) {
                freshness = -Infinity; // 期間前は表示されない
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
                    diffDays <= task.duration
                        ? task.duration - diffDays
                        : -Infinity;
            } else {
                // 指定日以前は-Infinity
                freshness = -Infinity;
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
    // [2003-11-27]@ 予定です
    // [2003-11-27]- 覚書です
    // [2003-11-27]+ ToDoです
    // [2003-11-27]! 〆切です

    const tasks: Task[] = [];
    const regex = /^\[(\d{4}-\d\d-\d\d)]([!.@+-])(\d*)\s+(.+)/;

    // 数字をつけなかったときのデフォルトは, 「-1」「+7」「!7」
    // https://kaorahi.github.io/howm/uu/#foottext:15
    const defaultDuration: Record<string, number> = {
        '-': 1,
        '+': 7,
        '!': 7,
    };

    fileItems.forEach((fileItem) => {
        fileItem.content.split('\n').forEach((line) => {
            const match = line.match(regex);
            if (match) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [_p, date, symbol, duration, title] = match;
                const parsedDate = parseDate(date);
                if (!parsedDate) {
                    return;
                }

                tasks.push({
                    date: parsedDate,
                    symbol,
                    duration:
                        parseInt(duration) || defaultDuration[symbol] || 0,
                    title,
                    fileItem,
                });
            }
        });
    });

    return tasks;
}

export function sortTasks(tasks: Task[]): Task[] {
    console.log(tasks.length);
    const today = new Date();
    tasks.sort(
        (a, b) => calculateFreshness(b, today) - calculateFreshness(a, today),
    );
    return tasks;
}

export function taskType(task: Task) {
    switch (task.symbol) {
        case '@':
            return 'Schedule';
        case '+':
            return 'Todo';
        case '!':
            return 'Deadline';
        case '-':
            return 'Memo';
        case '.':
            return 'Completed';
        default:
            return 'Unknown';
    }
}

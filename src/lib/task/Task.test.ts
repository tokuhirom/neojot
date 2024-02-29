import { expect, test } from 'vitest';
import { calculateFreshness } from './Task';

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

interface TestCase {
    deadline: string | null;
    scheduled: string | null;
    score: number;
}

function calcResults(
    currentDate: string,
    type: string,
    cases: TestCase[],
): TestCase[] {
    return cases.map((testCase) => {
        const { scheduled, deadline } = testCase;
        const calculatedScore = calc(scheduled, deadline, type, currentDate);
        return {
            scheduled,
            deadline,
            score: calculatedScore,
        };
    });
}

function calc(
    scheduled: string | null,
    deadline: string | null,
    type: string,
    currentDate: string,
) {
    return calculateFreshness(
        {
            scheduled: scheduled ? parseDate(scheduled) : null,
            deadline: deadline ? parseDate(deadline) : null,
            type: type,
        },
        parseDate(currentDate)!,
    );
}

test('calc TODO: Scheduled', () => {
    const currentDate = '2024-02-10';
    const cases: TestCase[] = [
        { scheduled: '2024-02-12', deadline: null, score: -1 }, // 前々日は低めに。。
        { scheduled: '2024-02-11', deadline: null, score: 0 }, // 前日はListViewには表示しない
        { scheduled: '2024-02-10', deadline: null, score: 1 }, // 当日はもちろん表示する
        { scheduled: '2024-02-09', deadline: null, score: 2 }, // 翌日は表示する
        { scheduled: '2024-02-08', deadline: null, score: 3 },
    ];

    expect(calcResults(currentDate, 'TODO', cases)).toStrictEqual(cases);
});

test('calc TODO: Deadline', () => {
    const currentDate = '2024-02-10';
    const cases: TestCase[] = [
        { deadline: '2024-02-14', scheduled: null, score: -Infinity }, // 4日前
        { deadline: '2024-02-13', scheduled: null, score: 0 }, // 3日前
        { deadline: '2024-02-12', scheduled: null, score: 1 }, // 2日前
        { deadline: '2024-02-11', scheduled: null, score: 2 }, // 締め切り日の前日はプラス
        { deadline: '2024-02-10', scheduled: null, score: 3 }, // 締め切り日当日はプラス
        { deadline: '2024-02-09', scheduled: null, score: 4 }, // 締め切り日の翌日なのでプラスがもっと増える
        { deadline: '2024-02-08', scheduled: null, score: 5 },
    ];

    expect(calcResults(currentDate, 'TODO', cases)).toStrictEqual(cases);
});

test('calc CANCELED', () => {
    const currentDate = '2024-02-10';
    const cases: TestCase[] = [
        { deadline: '2024-02-10', scheduled: null, score: -Infinity },
    ];

    expect(calcResults(currentDate, 'CANCELED', cases)).toStrictEqual(cases);
});

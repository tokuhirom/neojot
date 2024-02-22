import { expect, test } from 'vitest';
import { calculateFreshness, parseDate } from './Task';

interface TestCase {
    taskDate: string;
    score: number;
}

function calcResults(
    currentDate: string,
    duration: number,
    symbol: string,
    cases: TestCase[],
): TestCase[] {
    return cases.map((testCase) => {
        const { taskDate } = testCase;
        const calculatedScore = calc(taskDate, duration, symbol, currentDate);
        return {
            taskDate,
            score: calculatedScore,
        };
    });
}

function calc(
    taskDate: string,
    duration: number,
    symbol: string,
    currentDate: string,
) {
    return calculateFreshness(
        {
            date: parseDate(taskDate)!,
            duration: duration,
            symbol: symbol,
        },
        parseDate(currentDate)!,
    );
}

test('calc @: Scheduled', () => {
    // @: Scheduled, 予定
    // 予定はその日と前の duration days の間だけ表示される。そうでなければ -Infinity とする

    // 予定日自体ではスコアは0（予定日 = '2024-02-10', duration = 3）
    const currentDate = '2024-02-10';
    const cases = [
        { taskDate: '2024-02-11', score: -Infinity }, // 予定日のあと
        { taskDate: '2024-02-10', score: 0 },
        { taskDate: '2024-02-09', score: 0 },
        { taskDate: '2024-02-08', score: 0 },
        { taskDate: '2024-02-07', score: 0 },
        { taskDate: '2024-02-06', score: -Infinity }, // 表示期間の前
    ];

    expect(calcResults(currentDate, 3, '@', cases)).toStrictEqual(cases);
});

test('calc ! Deadline', () => {
    // !: Deadline, 締め切り
    // Deadline は締切の duration days 前からリストに表示される。
    // つまり、その前は -Infinity が score となる。
    // duration days 前の時点で score は 0。それ以後は 1,2,3... と増えていく。

    const currentDate = '2024-02-10'; // 締切日
    const duration = 3;
    const symbol = '!'; // タスクの種類（締切）

    const cases = [
        { taskDate: '2024-02-06', score: -Infinity }, // 締切日の4日前
        { taskDate: '2024-02-07', score: 0 }, // 締切日の3日前
        { taskDate: '2024-02-08', score: 1 }, // 締切日の2日前
        { taskDate: '2024-02-09', score: 2 }, // 締切日の1日前
        { taskDate: '2024-02-10', score: 3 }, // 締切日
        { taskDate: '2024-02-11', score: 4 }, // 締切日の1日後
        { taskDate: '2024-02-12', score: 5 }, // 締切日の2日後
    ];

    expect(calcResults(currentDate, duration, symbol, cases)).toStrictEqual(
        cases,
    );
});

test('calc + todo', () => {
    // +: TODO
    // todo は、タスク。
    // 指定日はscore 0。それ以後は 1ずつ増えていく。

    const currentDate = '2024-02-10'; // 締切日
    const duration = 3;
    const symbol = '+'; // タスクの種類（締切）

    const cases = [
        { taskDate: '2024-02-09', score: -Infinity },
        { taskDate: '2024-02-10', score: 0 }, // 指定日
        { taskDate: '2024-02-11', score: 1 },
        { taskDate: '2024-02-12', score: 2 },
    ];

    expect(calcResults(currentDate, duration, symbol, cases)).toStrictEqual(
        cases,
    );
});

test('calc - Memo', () => {
    // -: memo, 覚書
    // 指定日に 0 のスコアがつく。
    // つまり、その前は -Infinity が score となる。
    // duration days 前の時点で score は duration days。それ以後は duration days-1, duration days-2... と減っていく

    const currentDate = '2024-02-10'; // 締切日
    const duration = 3;
    const symbol = '-';

    const cases: TestCase[] = [
        { taskDate: '2024-02-09', score: -Infinity }, // 覚書の日の前（durationよりも前）
        { taskDate: '2024-02-10', score: 3 }, // 覚書の日
        { taskDate: '2024-02-11', score: 2 }, // 覚書の日の翌日
        { taskDate: '2024-02-12', score: 1 }, // 覚書の日の2日あと
        { taskDate: '2024-02-13', score: 0 },
    ];

    expect(calcResults(currentDate, duration, symbol, cases)).toStrictEqual(
        cases,
    );
});

test('calc . Completed', () => {
    // .: Completed
    // Completed は常に -Infinity

    const currentDate = '2024-02-10'; // 締切日
    const duration = 3;
    const symbol = '.';

    const cases = [
        { taskDate: '2024-02-10', score: -Infinity }, // 常に -Infinity
    ];

    expect(calcResults(currentDate, duration, symbol, cases)).toStrictEqual(
        cases,
    );
});

import { expect, test } from 'vitest';
import { calculateFreshness, parseDate } from './Task';

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

/*
test('calc ! Deadline', () => {
    // !: Deadline, 締め切り
    // Deadline は締切の duration days 前からリストに表示される。
    // つまり、その前は -Infinity が score となる。
    // duration days 前の時点で score は 0。それ以後は 1,2,3... と増えていく。

    const currentDate = '2024-02-10'; // 締切日
    const duration = 3;
    const symbol = '!'; // タスクの種類（締切）

    const cases = [
        { taskDate: '2024-02-06', score: -999 }, // 締切日の4日前
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
        { taskDate: '2024-02-09', score: -999 },
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
        { taskDate: '2024-02-09', score: -999 }, // 覚書の日の前（durationよりも前）
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
*/

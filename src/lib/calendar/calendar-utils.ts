export type CalendarDay = {
    day: number | null; // 日付、またはプレースホルダー用にnull
    date: Date | null; // 実際のDateオブジェクト、またはnull
};

export function generateCalendar(year: number, month: number): CalendarDay[][] {
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

export class type {}

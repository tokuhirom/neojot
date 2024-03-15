export function debounce<T extends (...args: unknown[]) => Promise<void>>(
    func: T,
    delay: number,
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return function (...args: Parameters<T>): void {
        clearTimeout(timeoutId as ReturnType<typeof setTimeout>);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}

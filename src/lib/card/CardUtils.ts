export function extractCardContent(content: string): string {
    // ALIAS と AUTOLINK のようなメタデータを削除
    // [[...]] のようなリンク記法を削除
    // 画像記法を削除
    return content
        .split('\n')
        .filter(
            (line) => !/^(?:(ALIAS|AUTOLINK):\s*|!\[|https?:\/\/)/.test(line),
        )
        .slice(1)
        .join('\n')
        .replace(/\[\[(.*?)]]/g, '$1');
}

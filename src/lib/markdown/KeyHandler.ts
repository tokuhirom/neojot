import { EditorView } from '@codemirror/view';
import { invoke } from '@tauri-apps/api/core';
import { format } from 'date-fns';

export function insertDateCommand(view: EditorView, key: string) {
    const dateStr =
        `${key}[Scheduled:` + format(new Date(), 'yyyy-MM-dd(EEE)') + ']: ';
    const from = view.state.selection.main.from;
    const to = from + dateStr.length;

    view.dispatch({
        changes: { from: from, insert: dateStr },
        selection: { anchor: to },
    });
    return true;
}

export function openInternalLink(
    view: EditorView,
    openEntry: (pageName: string) => void,
) {
    const { from, to } = view.state.selection.main;
    if (from === to) {
        // カーソル位置のみをチェック
        const line = view.state.doc.lineAt(from);
        const lineText = line.text;
        const lineOffset = from - line.from; // 行内オフセットを計算

        // カーソル位置から内部リンクを探す
        const linkRegex = /\[\[.*?]]|https?:\/\/\S+/g;
        let match: RegExpExecArray | null;
        while ((match = linkRegex.exec(lineText)) !== null) {
            if (
                match.index <= lineOffset &&
                match.index + match[0].length >= lineOffset
            ) {
                if (match[0].startsWith('http')) {
                    const url = match[0];
                    console.log(`opening url: ${url}`);
                    invoke('open_url', { url });
                    return true;
                } else {
                    // 内部リンクの場合はページを開く
                    const pageName = match[0].slice(2, -2); // リンク名の取得
                    openEntry(pageName);
                    return true;
                }
            }
        }
    }
    return false;
}

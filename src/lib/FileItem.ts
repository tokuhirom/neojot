export type FileItem = {
    filename: string,
    mtime: number,
    title: string,
    content: string,
};


export function extractTitle(content: string) {
    const lines = content.split("\n");
    if (lines.length >= 1) {
        return lines[0].replace(/^#+\s*/, '')
    } else {
        return "";
    }
}

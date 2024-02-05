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

export function shouldShowFileItem(fileItem: FileItem, searchWord: string): boolean {
    if (searchWord.length == 0) {
        return true;
    }

    const lowerCaseSearchWord = searchWord.toLowerCase();
    const lowerCaseTitle = fileItem.title.toLowerCase();
    const lowerCaseContent = fileItem.content.toLowerCase();

    let words = lowerCaseSearchWord.split(/\s+/).filter(it => it.length>0);
    let result = true;
    for (let word of words) {
        if (!lowerCaseTitle.includes(word) && !lowerCaseContent.includes(word)) {
            result = false;
            break;
        }
    }
    return result;
}

export function extractBrackets(content: string): string[] {
    const pattern = /\[\[(.*?)]]/g;
    const matches = [];
    let match;

    while ((match = pattern.exec(content)) !== null) {
        matches.push(match[1]);
    }

    return matches;
}

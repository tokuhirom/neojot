import {
    BaseDirectory,
    createDir,
    exists,
    readTextFile,
    removeFile,
    renameFile,
    writeTextFile
} from "@tauri-apps/api/fs";
import {invoke} from "@tauri-apps/api";
import {extractTitle, type FileItem} from "../FileItem";

export type CalendarData = Record<number, string[]>;

export async function saveMarkdownFile(filename: string, src: string) {
    // TODO atomic write
    await writeTextFile(filename,
        src,
        { dir: BaseDirectory.AppData });

    await writeCalendarFile(filename.replace(/.+\//, ''));
}

async function writeCalendarFile(basename: string) {
    const date = new Date();
    const calendarFileName = generateCalendarFileNameByDate(date);

    if (!await exists("calendar", {dir: BaseDirectory.AppData})) {
        await createDir("calendar", {dir: BaseDirectory.AppData});
    }

    const data = await readCalendarFile(date.getFullYear(), date.getMonth() + 1);
    const ary = data[date.getDate()] || [];
    if (!ary.includes(basename)) {
        ary.push(basename);
        data[date.getDate()] = ary;
    }
    await writeTextFile(calendarFileName, JSON.stringify(data), {dir: BaseDirectory.AppData});
}

export async function readCalendarFile(year: number, month: number) : Promise<CalendarData> {
    const filename = generateCalendarFileName(year, month);
    console.log(`readCalendarFile: ${filename}`)
    if (await exists(filename, {dir: BaseDirectory.AppData})) {
        const json = await readTextFile(filename, {dir: BaseDirectory.AppData});
        return JSON.parse(json) as CalendarData;
    } else {
        console.log(`missing file: ${filename}`)
        return {}
    }
}

function generateCalendarFileNameByDate(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return generateCalendarFileName(year, month);
}

function generateCalendarFileName(year: number, month: number): string {
    const formattedMonth = month < 10 ? `0${month}` : month.toString();
    return `calendar/${year}-${formattedMonth}.json`;
}

export async function loadMarkdownFile(name: string): Promise<string> {
    return await readTextFile(name, {
        dir: BaseDirectory.AppData
    });
}

export async function loadFileList(prefix: string, retry: boolean) : Promise<FileItem[]> {
    if (!await exists(prefix, {dir: BaseDirectory.AppData})) {
        await createDir(prefix, {dir: BaseDirectory.AppData});
    }

    let fileItems = await invoke('get_files', {prefix}) as FileItem[];
    console.log("loaded fileitems")
    console.log(fileItems)

    if (fileItems.length == 0 && prefix == "data") {
        // 最初の1ファイルを作成する
        console.log(`There's no files in ${prefix}. Create new file...`);

        const newFileItem = await createNewFileWithContent("# ");
        if (retry) {
            console.log(`Created new file ${newFileItem.filename}... so, i need to reload`);
            return await loadFileList(prefix, false);
        }
    }

    return fileItems;
}

function createNewFileName() {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `data/${year}${month}${day}${hours}${minutes}${seconds}.md`;
}

export async function createNewFile(): Promise<string> {
    const fileItem = await createNewFileWithContent("# ");
    return fileItem.filename;
}

export async function createNewFileWithContent(src: string): Promise<FileItem> {
    const filename = createNewFileName();
    console.log(`Adding new file: ${filename}`)
    await saveMarkdownFile(filename, src);

    return await invoke("load_file_item", {filename});
}

export async function archiveFile(fileItem: FileItem) {
    console.log(`Archive file: ${fileItem.filename}`)
    if (!await exists("archived", {dir: BaseDirectory.AppData})) {
        await createDir("archived", {dir: BaseDirectory.AppData});
    }

    await renameFile(
        `data/${fileItem.filename}`,
        `archived/${fileItem.filename}`,
        { dir: BaseDirectory.AppData });
}

export async function deleteArchivedFile(fileItem: FileItem) {
    await removeFile(`archived/${fileItem.filename}`, {
        dir: BaseDirectory.AppData
    });
}

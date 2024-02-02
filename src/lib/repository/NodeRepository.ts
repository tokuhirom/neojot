import {BaseDirectory, createDir, exists, readTextFile, writeTextFile} from "@tauri-apps/api/fs";
import {invoke} from "@tauri-apps/api";
import type {FileItem} from "../FileItem";

export async function saveMarkdownFile(name: string, src: string) {
    // TODO atomic write
    await writeTextFile(`data/${name}`,
        src,
        { dir: BaseDirectory.AppData });
}

export async function loadMarkdownFile(name: string): Promise<string> {
    return await readTextFile(`data/${name}`, {
        dir: BaseDirectory.AppData
    });
}


export async function loadFileList(retry: boolean) {
    if (!await exists("data", {dir: BaseDirectory.AppData})) {
        await createDir("data", {dir: BaseDirectory.AppData});
    }

    let fileItems = await invoke('get_files') as FileItem[];

    if (fileItems.length == 0) {
        // 最初の1ファイルを作成する
        const newFileName = createNewFile();
        if (retry) {
            console.log(`Created new file ${newFileName}... so, i need to reload`);
            return await loadFileList(false);
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

    return `${year}${month}${day}${hours}${minutes}${seconds}.md`;
}

export async function createNewFile(): Promise<string> {
    const filename = createNewFileName();
    console.log(`Adding new file: ${filename}`)
    await saveMarkdownFile(filename, "# ");
    return filename;
}


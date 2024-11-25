import {
    BaseDirectory,
    exists,
    mkdir,
    readTextFile,
    remove,
    rename,
    writeFile,
    writeTextFile,
} from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { type FileItem } from '../file_item/FileItem';
import { format } from 'date-fns';

export type CalendarData = Record<number, string[]>;

export async function saveMarkdownFile(filename: string, src: string) {
    // TODO atomic write
    await writeTextFile(filename, src, { baseDir: BaseDirectory.AppData });
}

export async function loadMarkdownFile(name: string): Promise<string> {
    return await readTextFile(name, {
        baseDir: BaseDirectory.AppData,
    });
}

export async function loadFileList(prefix: string): Promise<FileItem[]> {
    if (!(await exists('', { baseDir: BaseDirectory.AppData }))) {
        console.log(`There's no data directory. try to create it. prefix`);
        await mkdir('', { baseDir: BaseDirectory.AppData });
    }
    if (!(await exists(prefix, { baseDir: BaseDirectory.AppData }))) {
        console.log(
            `There's no data directory. try to create it. prefix: ${prefix}`,
        );
        await mkdir(prefix, { baseDir: BaseDirectory.AppData });
    }

    const fileItems = (await invoke('get_files', { prefix })) as FileItem[];
    console.log('loaded file items');
    console.log(fileItems);

    fileItems.sort((a, b) => b.mtime - a.mtime); // sort it.
    return fileItems;
}

function createNewFileName() {
    const now = new Date();
    const formattedDate = format(now, 'yyyyMMddHHmmss');
    return `data/${formattedDate}.md`;
}
export async function createNewFileWithContent(src: string): Promise<FileItem> {
    const filename = createNewFileName();
    console.log(`Adding new file: ${filename}`);
    await saveMarkdownFile(filename, src);

    return await invoke('load_file_item', { filename });
}

export async function archiveFile(fileItem: FileItem) {
    console.log(`Archive file: ${fileItem.filename}`);
    await mkdir_p('archived');

    const content = await readTextFile(fileItem.filename, {
        baseDir: BaseDirectory.AppData,
    });
    if (content.match(/^#?\s*$/)) {
        console.log('EMPTY FILE');
        await remove(fileItem.filename, { baseDir: BaseDirectory.AppData });
        return;
    }

    await rename(
        fileItem.filename,
        fileItem.filename.replace('data/', 'archived/'),
        {
            oldPathBaseDir: BaseDirectory.AppData,
            newPathBaseDir: BaseDirectory.AppData,
        },
    );
    if (fileItem.filename.endsWith('.excalidraw')) {
        await remove(
            fileItem.filename.replace('.excalidraw.md', '.excalidraw.png'),
            {
                baseDir: BaseDirectory.AppData,
            },
        );
    }
}

export async function unarchiveFile(fileItem: FileItem) {
    console.log(`Unarchive file: ${fileItem.filename}`);
    await mkdir_p('data');

    await rename(
        fileItem.filename,
        fileItem.filename.replace('archived/', 'data/'),
        {
            oldPathBaseDir: BaseDirectory.AppData,
            newPathBaseDir: BaseDirectory.AppData,
        },
    );
}

export async function deleteArchivedFile(fileItem: FileItem) {
    await remove(fileItem.filename, {
        baseDir: BaseDirectory.AppData,
    });
}

function createImageFileName(ext: string) {
    const now = new Date();
    const formattedDate = format(now, 'yyyyMMddHHmmss');
    return `images/${formattedDate}.${ext}`;
}

export async function readAndSaveImage(file: File): Promise<string> {
    await mkdir_p('images');

    // 画像をCanvasに読み込む
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0);

    // Canvasの内容をJPEG形式でArrayBufferとして取得
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.result instanceof ArrayBuffer) {
                            resolve(reader.result);
                        } else {
                            reject(new Error('Expected ArrayBuffer'));
                        }
                    };
                    reader.onerror = () =>
                        reject(new Error('Error reading blob as ArrayBuffer'));
                    reader.readAsArrayBuffer(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            },
            'image/jpeg',
            0.85,
        ); // JPEG品質を指定
    });

    const buffer = new Uint8Array(arrayBuffer);
    const path = createImageFileName('jpg'); // 拡張子をJPEGに固定

    await writeFile(path, buffer, { baseDir: BaseDirectory.AppData });
    return path;
}

// ファイルから画像を読み込むヘルパー関数
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

export async function mkdir_p(path: string) {
    if (!(await exists(path, { baseDir: BaseDirectory.AppData }))) {
        await mkdir(path, { baseDir: BaseDirectory.AppData });
    }
}

export class type {}

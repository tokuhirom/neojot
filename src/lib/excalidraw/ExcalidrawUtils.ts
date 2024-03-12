import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
import { uint8ArrayToDataUrl } from '../markdown/ImageViewWidget';
import type { FileItem } from '../file_item/FileItem';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

export function getExcalidrawTexts(elements: ExcalidrawElement[]): string[] {
    const texts: string[] = [];
    for (const element of elements) {
        if (element.isDeleted) {
            continue;
        }
        if (element.type === 'text') {
            texts.push(element.text);
        }
    }
    return texts;
}

export async function loadExcalidrawImage(
    fileItem: FileItem,
): Promise<string | undefined> {
    if (fileItem.filename.endsWith('.excalidraw')) {
        try {
            const blob = await readFile(
                makeExcalidrawThumbnailFilename(fileItem.filename),
                {
                    baseDir: BaseDirectory.AppData,
                },
            );
            return await uint8ArrayToDataUrl(blob);
        } catch (e) {
            console.error(e);
            return undefined;
        }
    } else {
        return undefined;
    }
}

export function makeExcalidrawThumbnailFilename(filename: string): string {
    return filename
        .replace('data/', 'excalidraw-thumbnails/')
        .replace('archived/', 'excalidraw-thumbnails/')
        .replace('.excalidraw', '.jpg');
}

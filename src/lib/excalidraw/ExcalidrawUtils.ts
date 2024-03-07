import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
import { uint8ArrayToDataUrl } from '../markdown/ImageViewWidget';
import type { FileItem } from '../file_item/FileItem';

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
    if (fileItem.filename.endsWith('.excalidraw.md')) {
        const blob = await readFile(fileItem.filename.replace('.md', '.png'), {
            baseDir: BaseDirectory.AppData,
        });
        return await uint8ArrayToDataUrl(blob);
    } else {
        return undefined;
    }
}

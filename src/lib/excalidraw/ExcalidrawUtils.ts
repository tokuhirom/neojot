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

import { extractBrackets, type FileItem } from './FileItem';

export type Links = {
    links: FileItem[];
    twoHopLinks: TwoHopPair[];
    newLinks: string[];
};

type TwoHopPair = {
    src: FileItem;
    dst: FileItem[];
};

function pushValue<K, V>(map: Map<K, V[]>, src: K, dst: V) {
    if (map.get(src)) {
        const exists = map.get(src)!.some((item) => item === dst);
        if (!exists) {
            map.get(src)!.push(dst);
        }
    } else {
        map.set(src, [dst]);
    }
}

export function extractLinks(fileItems: FileItem[]): {
    forward: Map<string, string[]>;
    backward: Map<string, string[]>;
} {
    const forwardLinks: Map<string, string[]> = new Map();
    const backwardLinks: Map<string, string[]> = new Map();
    for (const srcFileItem of fileItems) {
        const links = extractBrackets(srcFileItem.content);
        for (const link of links) {
            if (srcFileItem.title !== link) {
                pushValue(forwardLinks, srcFileItem.title, link);
                pushValue(backwardLinks, link, srcFileItem.title);
            }
        }
    }

    return {
        forward: forwardLinks,
        backward: backwardLinks,
    };
}

export function buildLinks(
    selectedFileItem: FileItem,
    fileItems: FileItem[],
): Links {
    const title2fileItem: Record<string, FileItem> = {};
    for (const fileItem of fileItems) {
        title2fileItem[fileItem.title] = fileItem;
    }

    const { forward, backward } = extractLinks(fileItems);

    const links: FileItem[] = []; // links and backward links(unique)
    const twoHopLinksMap: Map<FileItem, FileItem[]> = new Map();
    const newLinks: string[] = [];
    (forward.get(selectedFileItem.title) || []).forEach((dest) => {
        if (dest === selectedFileItem.title) {
            // do nothing
        } else if (
            (forward.has(dest) ||
                (backward.has(dest) && backward.get(dest)!.length > 1)) &&
            title2fileItem[dest]
        ) {
            // two hop links
            const twoHopSrc = title2fileItem[dest];
            const forwardTwoHopDst = (forward.get(dest) || [])
                .map((it) => title2fileItem[it])
                .filter((it) => it);
            const backwardTwoHopDst = (backward.get(dest) || [])
                .map((it) => title2fileItem[it])
                .filter((it) => it);
            const twoHopDst = [
                ...new Set([...forwardTwoHopDst, ...backwardTwoHopDst]),
            ].filter((it) => it.title != selectedFileItem.title);
            twoHopLinksMap.set(twoHopSrc, twoHopDst);
        } else {
            if (title2fileItem[dest]) {
                // links block
                links.push(title2fileItem[dest]);
            } else {
                // new links
                newLinks.push(dest);
            }
        }
    });
    (backward.get(selectedFileItem.title) || []).forEach((dest) => {
        links.push(title2fileItem[dest]);
    });

    const twoHopItems = new Set();
    twoHopLinksMap.forEach((dsts, src) => {
        twoHopItems.add(src.title); // src を追加
        dsts.forEach((dst) => twoHopItems.add(dst.title)); // dst を追加
    });
    const uniqueLinks = links
        .filter((item) => !twoHopItems.has(item.title))
        .filter((it) => it.title !== selectedFileItem.title);

    const twoHopLinks: TwoHopPair[] = Array.from(twoHopLinksMap).map(
        ([src, dst]) => ({ src, dst }),
    );
    twoHopLinks.sort((a, b) => b.src.mtime - a.src.mtime);

    return {
        links: uniqueLinks,
        twoHopLinks,
        newLinks,
    };
}

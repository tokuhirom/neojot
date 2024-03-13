import { extractBracketsWithCache, type FileItem } from '../file_item/FileItem';

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
        const links = extractBracketsWithCache(srcFileItem);
        for (const link of links) {
            if (srcFileItem.title !== link) {
                pushValue(
                    forwardLinks,
                    srcFileItem.title.toLowerCase(),
                    link.toLowerCase(),
                );
                pushValue(
                    backwardLinks,
                    link.toLowerCase(),
                    srcFileItem.title.toLowerCase(),
                );
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
    console.log('Starting buildLinks');
    const t0 = Date.now();

    const lowerTitle2fileItem: Record<string, FileItem> = {};
    for (const fileItem of fileItems) {
        lowerTitle2fileItem[fileItem.title.toLowerCase()] = fileItem;
    }

    const { forward, backward } = extractLinks(fileItems);

    const links: FileItem[] = []; // links and backward links(unique)
    const twoHopLinksMap: Map<FileItem, FileItem[]> = new Map();
    const newLinks: string[] = [];
    const selectedLowerTitle = selectedFileItem.title.toLowerCase();
    (forward.get(selectedLowerTitle) || []).forEach((dest) => {
        if (dest === selectedLowerTitle) {
            // do nothing
        } else if (
            (forward.has(dest) ||
                (backward.has(dest) && backward.get(dest)!.length > 1)) &&
            lowerTitle2fileItem[dest]
        ) {
            // two hop links
            const twoHopSrc = lowerTitle2fileItem[dest];
            const forwardTwoHopDst = (forward.get(dest) || [])
                .map((it) => lowerTitle2fileItem[it])
                .filter((it) => it);
            const backwardTwoHopDst = (backward.get(dest) || [])
                .map((it) => lowerTitle2fileItem[it])
                .filter((it) => it);
            const twoHopDst = [
                ...new Set([...forwardTwoHopDst, ...backwardTwoHopDst]),
            ].filter((it) => it.title != selectedLowerTitle);

            if (twoHopDst.length > 0) {
                twoHopLinksMap.set(twoHopSrc, twoHopDst);
            } else {
                links.push(twoHopSrc);
            }
        } else {
            if (lowerTitle2fileItem[dest]) {
                // links block
                links.push(lowerTitle2fileItem[dest]);
            } else {
                // new links
                newLinks.push(dest);
            }
        }
    });
    (backward.get(selectedLowerTitle) || []).forEach((dest) => {
        links.push(lowerTitle2fileItem[dest]);
    });

    const twoHopItems = new Set();
    twoHopLinksMap.forEach((dsts, src) => {
        twoHopItems.add(src.title); // src を追加
        dsts.forEach((dst) => twoHopItems.add(dst.title)); // dst を追加
    });
    const linksFilenameSet = new Set<string>();
    const uniqueLinks = links
        .filter((item) => {
            if (!linksFilenameSet.has(item.filename)) {
                linksFilenameSet.add(item.filename);
                return true;
            }
            return false; // Exclude this item, since it's a duplicate
        })
        .filter((item) => !twoHopItems.has(item.title))
        .filter((it) => it.title !== selectedLowerTitle);

    const twoHopLinks: TwoHopPair[] = Array.from(twoHopLinksMap).map(
        ([src, dst]) => ({ src, dst }),
    );
    twoHopLinks.sort((a, b) => b.src.mtime - a.src.mtime);

    console.log(`Finished buildLinks. ${Date.now() - t0}ms`);

    return {
        links: uniqueLinks,
        twoHopLinks,
        newLinks,
    };
}

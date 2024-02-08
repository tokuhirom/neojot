import {extractBrackets, type FileItem} from "./FileItem";

export type Links = {
    links: FileItem[],
    twoHopLinks: TwoHopPair[],
    newLinks: string[],
};

type TwoHopPair = {
    src: FileItem,
    dst: FileItem[],
};

function pushValue<K, V>(map: Map<K, V[]>, src: K, dst: V) {
    // @ts-ignore
    if (map.get(src)) {
        // @ts-ignore
        const exists: Map<K, V[]> = map.get(src)!!.some(item => item === dst);
        if (!exists) {
            map.get(src)!!.push(dst);
        }
    } else {
        map.set(src, [dst]);
    }
}

export function extractLinks(fileItems: FileItem[]): {
    forward: Map<string, string[]>,
    backward: Map<string, string[]>,
} {
    const forwardLinks: Map<string, string[]> = new Map();
    const backwardLinks: Map<string, string[]> = new Map();
    for (let srcFileItem of fileItems) {
        const links = extractBrackets(srcFileItem.content);
        for (let link of links) {
            pushValue(forwardLinks, srcFileItem.title, link);
            pushValue(backwardLinks, link, srcFileItem.title);
        }
    }

    return {
        forward: forwardLinks,
        backward: backwardLinks,
    }
}

export function buildLinks(selectedFileItem: FileItem, fileItems: FileItem[]) : Links {
    const title2fileItem: Record<string, FileItem> = {};
    for (let fileItem of fileItems) {
        title2fileItem[fileItem.title] = fileItem;
    }

    const {forward, backward} = extractLinks(fileItems);

    const links: FileItem[] = []; // links and backward links(unique)
    const twoHopLinksMap: Map<FileItem, FileItem[]> = new Map();
    const newLinks: string[] = [];
    (forward.get(selectedFileItem.title) || []).forEach(dest => {
        if (forward.has(dest)) {
            // two hop links
            const twoHopSrc = title2fileItem[dest];
            const twoHopDst = forward.get(dest)!!.map(it => title2fileItem[it]).filter(it => it);
            twoHopLinksMap.set(twoHopSrc, twoHopDst);
        } else {
            if (title2fileItem.hasOwnProperty(dest)) {
                // links block
                links.push(title2fileItem[dest]);
            } else {
                // new links
                newLinks.push(dest);
            }
        }
    });
    (backward.get(selectedFileItem.title) || []).forEach(dest => {
        links.push(title2fileItem[dest]);
    });

    const twoHopItems = new Set();
    twoHopLinksMap.forEach((dsts, src) => {
        twoHopItems.add(src.title); // src を追加
        dsts.forEach(dst => twoHopItems.add(dst.title)); // dst を追加
    });
    const uniqueLinks = links.filter(item => !twoHopItems.has(item.title));


    const twoHopLinks: TwoHopPair[] = Array.from(twoHopLinksMap).map(
        ([src, dst]) => ({ src, dst })
    );
    twoHopLinks.sort((a, b) => b.src.mtime - a.src.mtime);

    return {
        links: uniqueLinks,
        twoHopLinks,
        newLinks,
    }
}

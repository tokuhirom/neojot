import {BaseDirectory, createDir, exists, readTextFile, writeTextFile} from "@tauri-apps/api/fs";
import {type Entry, generateTimestampId, type Line} from "../Line";

export class NodeRepository {
    constructor() {
    }

    async save(name: string, entry: Entry) {
        const data = JSON.stringify(entry, null, 1);

        // TODO atomic write
        await writeTextFile(`data/${name}`,
            data,
            { dir: BaseDirectory.AppData });
    }

    async load(name: string): Promise<Entry> {
        const json = await readTextFile(`data/${name}`, {
            dir: BaseDirectory.AppData
        });
        return JSON.parse(json) as Entry;
    }
}

export function buildRootNode(): Entry {
    return {
        title: "",
        lines: [
            {
                id: generateTimestampId(),
                body: "",
                indent: 0,
            }
        ]
    }
}

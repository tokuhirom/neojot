import {BaseDirectory, createDir, exists, readTextFile, writeTextFile} from "@tauri-apps/api/fs";
import {type Entry, generateTimestampId, type Line} from "../Line";

export class NodeRepository {
    constructor() {
    }

    async save(name: string, src: string) {
        // TODO atomic write
        await writeTextFile(`data/${name}`,
            src,
            { dir: BaseDirectory.AppData });
    }

    async load(name: string): Promise<string> {
        return await readTextFile(`data/${name}`, {
            dir: BaseDirectory.AppData
        });
    }
}

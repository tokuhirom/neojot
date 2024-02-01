import {BaseDirectory, readTextFile, writeTextFile} from "@tauri-apps/api/fs";

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

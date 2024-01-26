import {BaseDirectory, createDir, exists, readTextFile, writeTextFile} from "@tauri-apps/api/fs";
import {generateTimestampId, type OutlineNode} from "../OutlineNode";

export class NodeRepository {
    constructor() {
    }

    async save(node: OutlineNode) {
        const data = JSON.stringify(node, null, 1);
        if (!await exists('', { dir: BaseDirectory.AppData })) {
            await createDir("", {dir: BaseDirectory.AppData});
        }

        // TODO atomic write
        await writeTextFile('messages.json',
            data,
            { dir: BaseDirectory.AppData });
    }

    async load() {
        if (!await exists('messages.json', { dir: BaseDirectory.AppData })) {
            return {
                id: "**ROOT**",
                body: "",
                children: [
                    {
                        id: generateTimestampId(),
                        body: "",
                        children: []
                    }
                ],
            };
        }

        const json = await readTextFile("messages.json", {
            dir: BaseDirectory.AppData
        });
        return JSON.parse(json) as OutlineNode;
    }
}

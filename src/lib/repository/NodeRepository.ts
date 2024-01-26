import {BaseDirectory, createDir, exists, readTextFile, writeTextFile} from "@tauri-apps/api/fs";
import {generateTimestampId, type OutlineNode} from "../OutlineNode";

export class NodeRepository {
    constructor() {
    }

    async save(name: string, node: OutlineNode) {
        const data = JSON.stringify(node, null, 1);

        // TODO atomic write
        await writeTextFile(`data/${name}`,
            data,
            { dir: BaseDirectory.AppData });
    }

    async load(name: string): Promise<OutlineNode> {
        const json = await readTextFile(`data/${name}`, {
            dir: BaseDirectory.AppData
        });
        return JSON.parse(json) as OutlineNode;
    }
}

export function buildRootNode(): OutlineNode {
    return {
        id: "**ROOT**",
        body: "**ROOT**",
        children: [
            {
                id: generateTimestampId(),
                body: "",
                children: []
            }
        ],
    }
}

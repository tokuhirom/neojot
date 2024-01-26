import { expect, test } from 'vitest'
import {createOutlineNode, insertNewNodeAfter, type OutlineNode} from "./OutlineNode";

test('insertNewNodeAfter', () => {
    let root = buildRootNodeEx();

    let n1 = createOutlineNode();
    n1.body = "n1";
    root.children.push(n1);

    insertNewNodeAfter(root, n1);

    console.log(JSON.stringify(root, null, 4));
    expect(stringify(root)).toStrictEqual([
        "**ROOT**",
        " n1",
        " ",
    ])
})

function buildRootNodeEx(): OutlineNode {
    return {
        id: "**ROOT**",
        body: "**ROOT**",
        children: [
        ],
    }
}

function stringify(node: OutlineNode): string[] {
    let buffer: string[] = [];

    function i(indent: number) {
        let p = "";
        for (let j = 0; j <indent; j++) {
            p += " ";
        }
        return p;
    }

    function s(indent: number, node: OutlineNode): string {
        buffer.push(i(indent) + node.body);
        for (let child of node.children) {
            s(indent+1, child);
        }
    }

    s(0, node);
    return buffer;
}

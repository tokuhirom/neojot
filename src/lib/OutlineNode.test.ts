import { expect, test } from 'vitest'
import {createOutlineNode, insertNewNodeAfter, type OutlineNode, stringifyNode} from "./OutlineNode";

test('insertNewNodeAfter', () => {
    let root = buildRootNodeEx();

    let n1 = createOutlineNode();
    n1.body = "n1";
    root.children.push(n1);

    insertNewNodeAfter(root, n1);

    console.log(JSON.stringify(root, null, 4));
    expect(stringifyNode(root)).toStrictEqual([
        "**ROOT**",
        " n1",
        " ",
    ])
})

test('insertNewNodeAfter again', () => {
    let root: OutlineNode = {
        id: "**ROOT**",
        body: "**ROOT**",
        children: [
            {
                id: "ohogehoge",
                body: "ohogehoge",
                children: [
                    {
                        id: "aaaa",
                        body: "test",
                        children: [],
                    }
                ]
            }
        ],
    };
    let parent = root.children[0];
    let target = root.children[0].children[0];
    expect(target.body).toBe("test")

    insertNewNodeAfter(parent, target);

    console.log(JSON.stringify(root, null, 4));
    expect(stringifyNode(root)).toStrictEqual([
        "**ROOT**",
        " ohogehoge",
        "  test",
        "  ",
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


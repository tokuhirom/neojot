import { expect, test } from 'vitest'
import {createOutlineNode, type Entry, insertNewLineAfter} from "./Line";

test('insertNewNodeAfter', () => {
    let root = buildEntry();

    let n1 = createOutlineNode();
    n1.body = "n1";
    root.lines.push(n1);

    insertNewLineAfter(root, n1);

    console.log(JSON.stringify(root, null, 4));
    expect(stringify(root)).toStrictEqual([
        "TITLE: DUMMY TITLE",
        "n1",
        "",
    ])
})

function buildEntry(): Entry {
    return {
        title: "DUMMY TITLE",
        lines: []
    }
}


function stringify(entry: Entry) {
    let result = [`TITLE: ${entry.title}`];
    entry.lines.forEach((line) => {
        let buf = '';
        for (let i=0; i<line.indent; i++) {
            buf += ' ';
        }
        result.push(buf + line.body);
    });
    return result;
}

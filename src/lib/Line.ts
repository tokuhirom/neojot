export type Entry = {
    title: string,
    lines: Line[]
};

export type Line = {
    id: string,
    body: string,
    indent: number,
}

// TODO remove?
export function createOutlineNode(): Line {
    return {
        id: generateTimestampId(),
        body: "",
        indent: 0,
    };
}

export function generateTimestampId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    const millis = now.getMilliseconds().toString().padStart(3, '0');

    return `${year}${month}${day}${hour}${minute}${second}${millis}`;
}

export function removeLine(entry: Entry, lineToRemove: Line): Line {
    // If there are no lines in the entry, return null immediately
    if (entry.lines.length <= 1) {
        throw new Error("The lines are empty");
    }

    const index = entry.lines.findIndex(line => line.id === lineToRemove.id);

    // If the line to remove is not found, return the first line
    if (index === -1) {
        return entry.lines[0];
    }

    // Remove the line
    entry.lines.splice(index, 1);

    // Return the next line if it exists, otherwise the last line
    if (entry.lines.length > index) {
        return entry.lines[index]; // Next line
    } else  {
        return entry.lines[entry.lines.length - 1]; // Last line
    }
}

export function insertNewLineAfter(entry: Entry, referenceLine: Line): Line {
    const newLine: Line = {
        id: generateTimestampId(),
        body: "",
        indent: referenceLine.indent
    };

    const index = entry.lines.findIndex(line => line.id === referenceLine.id);
    if (index !== -1) {
        console.log("insertNewLineAfter: insert by splice");
        entry.lines.splice(index + 1, 0, newLine);
    } else {
        console.log("insertNewLineAfter: insert by push");
        entry.lines.push(newLine);
    }

    return newLine;
}

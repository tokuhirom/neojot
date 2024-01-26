export type OutlineNode = {
    id: string,
    body: string,
    children: OutlineNode[],
}

export function createOutlineNode(): OutlineNode {
    return {
        id: generateTimestampId(),
        body: "",
        children: [],
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

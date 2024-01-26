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

export function insertNewNodeAfter(parentNode: OutlineNode, node: OutlineNode): OutlineNode | undefined {
    const index = parentNode.children.findIndex(child => child.id === node.id);
    if (index === -1) {
        return;
    }

    const newNode = createOutlineNode();
    parentNode.children.splice(index + 1, 0, newNode);
    return newNode;
}

export function removeNode(parentNode: OutlineNode, node: OutlineNode): OutlineNode | undefined {
    const index = parentNode.children.findIndex(child => child.id === node.id);
    if (index === -1) {
        return;
    }

    parentNode.children.splice(index, 1);
    if (index <= 1) {
        return parentNode;
    } else {
        return parentNode.children[index-1];
    }
}

export function moveNodeDown(parentNode: OutlineNode, node: OutlineNode): boolean {
    const children = parentNode.children;
    const nodeIndex = children.findIndex(child => child.id === node.id);

    if (nodeIndex <= 0) {
        return false;
    }

    const previousSibling = children[nodeIndex - 1];
    children.splice(nodeIndex, 1);
    previousSibling.children.push(node);

    return true;
}

function findParentNode(root: OutlineNode, childId: string): OutlineNode | null {
    for (const child of root.children) {
        if (child.id === childId) {
            return root;
        }
        const potentialParent = findParentNode(child, childId);
        if (potentialParent) {
            return potentialParent;
        }
    }
    return null;
}

export function moveNodeUp(root: OutlineNode, parentNode: OutlineNode, node: OutlineNode): boolean {
    const parentOfParent = findParentNode(root, parentNode.id);
    const nodeIndex = parentNode.children.findIndex(child => child.id === node.id);

    // ノードが親ノードの中に見つからない場合は何もしない
    if (nodeIndex === -1) {
        return false;
    }

    // 親ノードがルートノードである場合、直接ルートの子として挿入
    if (!parentOfParent) {
        root.children.push(node);
    } else {
        // 親の兄弟ノードとして挿入
        const parentIndex = parentOfParent.children.findIndex(child => child.id === parentNode.id);
        if (parentIndex === -1) {
            return false;
        }
        parentOfParent.children.splice(parentIndex + 1, 0, node);
    }

    // 元の親からノードを削除
    parentNode.children.splice(nodeIndex, 1);

    return true;
}

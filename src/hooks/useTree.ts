import { DataNode } from "antd/lib/tree";
import { useCallback, useState } from "react";

const findNodeRecursively = (tree: DataNode[], key: string): DataNode | undefined => {
    for (const node of tree) {
        if (node.key === key) return node;
        if (node.children?.length) return findNodeRecursively(node.children, key);
    }
}

interface UseTree {
    tree: DataNode[];
    node(key: string): DataNode | undefined;
    addNodeAtEnd(title: string, key: string, children?: DataNode[]): void;
    addChildrenToNode(key: string, children: DataNode[]): void;
    removeNode(key: string): void;
    createNode(title: string, key: string, children?: DataNode[]): DataNode;
    dropTree(): void;
}

export function useTree(): UseTree {
    const [tree, setTree] = useState<DataNode[]>([]);

    const node = useCallback((key) => findNodeRecursively(tree, key), [tree]);

    const addNodeAtEnd = useCallback((title, key, children = []) => {
        setTree(tree => [
            ...tree,
            {
                title, key, children
            }
        ]);
    }, []);

    const addChildrenToNode = useCallback((key, children) => {
        setTree(_tree => {
            const idx = _tree.findIndex((n) => n.key === key);
            if (idx > -1) {
                const node = _tree[idx];
                if (node.children?.length) {
                    node.children.push(...children);
                } else {
                    node.children = children;
                }
                return [..._tree];
            }
            return _tree;
        });
    }, []);

    const removeNode = useCallback((key) => {
        setTree(_tree => {
            const idx = _tree.findIndex((n) => n.key === key);
            if (idx > -1) {
                _tree.splice(idx, 1);
                return [..._tree];
            }
            return _tree;
        });
    }, []);

    const createNode = useCallback((title, key, children) => ({
        title, key, children
    }), []);

    const dropTree = useCallback(() => {
        setTree([]);
    }, []);

    return {
        tree,
        node,
        createNode,
        addNodeAtEnd,
        addChildrenToNode,
        removeNode,
        dropTree
    };
}

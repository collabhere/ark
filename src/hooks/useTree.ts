import { DataNode } from "antd/lib/tree";
import React, { useCallback, useState } from "react";

const findNodeRecursively = (tree: DataNode[], key: string): DataNode | undefined => {
    let result;
    for (const node of tree) {
        if (node.key === key) result = node;

        if (!result && node.children?.length)
            result = findNodeRecursively(node.children, key);

        if (result) return result;
    }
    return result;
}

type NodeProperties = Pick<DataNode, "className" | "icon" | "disabled" | "children">;


interface UseTree {
    tree: DataNode[];
    node(key: string): DataNode | undefined;
    addNodeAtEnd(title: React.ReactNode, key: string, children?: DataNode[], properties?: NodeProperties): void;
    addChildrenToNode(key: string, children: DataNode[]): void;
    removeNode(key: string): void;
    updateNodeProperties(key: string, properties: NodeProperties): void;
    createNode(title: React.ReactNode, key: string, children?: DataNode[], properties?: NodeProperties): DataNode;
    dropTree(): void;
}

export function useTree(): UseTree {
    const [tree, setTree] = useState<DataNode[]>([]);

    const node: UseTree["node"] = useCallback((key) => findNodeRecursively(tree, key), [tree]);

    const updateNodeProperties: UseTree["updateNodeProperties"] = useCallback((key, properties: NodeProperties) => {
        setTree(_tree => {
            for (const node of _tree) {
                if (node.key === key) {
                    Object.assign(node, properties);
                    return [..._tree];
                }
            }
            return _tree;
        })
    }, [])

    const createNode: UseTree["createNode"] = useCallback((title, key, children = [], properties = {}) => ({
        title,
        key,
        children,
        ...properties
    }), []);

    const addNodeAtEnd: UseTree["addNodeAtEnd"] = useCallback((title, key, children = [], properties = {}) => {
        setTree(tree => [
            ...tree,
            createNode(title, key, children, properties)
        ]);
    }, [createNode]);

    const addChildrenToNode: UseTree["addChildrenToNode"] = useCallback((key, children) => {
        setTree(_tree => {
            const node = findNodeRecursively(_tree, key);
            if (node) {
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

    const removeNode: UseTree["removeNode"] = useCallback((key) => {
        setTree(_tree => {
            const idx = _tree.findIndex((n) => n.key === key);
            if (idx > -1) {
                _tree.splice(idx, 1);
                return [..._tree];
            }
            return _tree;
        });
    }, []);

    const dropTree: UseTree["dropTree"] = useCallback(() => {
        setTree([]);
    }, []);

    return {
        tree,
        node,
        createNode,
        addNodeAtEnd,
        addChildrenToNode,
        updateNodeProperties,
        removeNode,
        dropTree
    };
}

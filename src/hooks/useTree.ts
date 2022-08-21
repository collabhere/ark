import { TreeNodeInfo } from "@blueprintjs/core";
import { useCallback, useState } from "react";

const findNodeRecursively = (tree: TreeNodeInfo[], key: string): TreeNodeInfo | undefined => {
	let result;
	for (const node of tree) {
		if (node.id === key) result = node;

		if (!result && node.childNodes?.length) result = findNodeRecursively(node.childNodes, key);

		if (result) return result;
	}
	return result;
};

type NodeProperties = Pick<TreeNodeInfo, "className" | "icon" | "disabled" | "childNodes" | "isExpanded" | "hasCaret">;

interface UseTree {
	tree: TreeNodeInfo[];
	node(key: string): TreeNodeInfo | undefined;
	addNodeAtEnd(title: JSX.Element, key: string, childNodes?: TreeNodeInfo[], properties?: NodeProperties): void;
	addChildrenToNode(key: string, childNodes: TreeNodeInfo[]): void;
	removeNode(key: string): void;
	updateNodeProperties(key: string, properties: NodeProperties): void;
	createNode(title: JSX.Element, key: string, childNodes?: TreeNodeInfo[], properties?: NodeProperties): TreeNodeInfo;
	dropTree(): void;
}

export function useTree(): UseTree {
	const [tree, setTree] = useState<TreeNodeInfo[]>([]);

	const node: UseTree["node"] = useCallback((key) => findNodeRecursively(tree, key), [tree]);

	const updateNodeProperties: UseTree["updateNodeProperties"] = useCallback(
		(key, properties: NodeProperties) => {
			setTree((_tree) => {
				const node = findNodeRecursively(tree, key);
				if (node) {
					Object.assign(node, properties);
					return [..._tree];
				}

				return _tree;
			});
		},
		[tree],
	);

	const createNode: UseTree["createNode"] = useCallback(
		(label, id, childNodes = [], properties = {}) => ({
			label,
			id,
			childNodes,
			...properties,
		}),
		[],
	);

	const addNodeAtEnd: UseTree["addNodeAtEnd"] = useCallback(
		(title, key, childNodes = [], properties = {}) => {
			setTree((tree) => [...tree, createNode(title, key, childNodes, properties)]);
		},
		[createNode],
	);

	const addChildrenToNode: UseTree["addChildrenToNode"] = useCallback((key, childNodes) => {
		setTree((_tree) => {
			const node = findNodeRecursively(_tree, key);
			if (node) {
				if (node.childNodes?.length) {
					node.childNodes.push(...childNodes);
				} else {
					node.childNodes = childNodes;
				}
				return [..._tree];
			}
			return _tree;
		});
	}, []);

	const removeNode: UseTree["removeNode"] = useCallback((key) => {
		setTree((_tree) => {
			const idx = _tree.findIndex((n) => n.id === key);
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
		dropTree,
	};
}

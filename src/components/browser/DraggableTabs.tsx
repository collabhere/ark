import React, { useState } from "react";
import { Tabs } from "antd";
import {
	DndProvider,
	DragSource,
	DragSourceSpec,
	DropTarget,
	DropTargetSpec,
} from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TabsProps } from "antd/lib/tabs";

interface DNDTabProps {
	moveTabNode: (dragKey: string, hoverKey: string) => void;
	index: string;
	children: React.ReactChildren;
}

const IDENTIFIER = "BROWSER_TAB";

function TabNode({ connectDragSource, connectDropTarget, children }) {
	return connectDragSource(connectDropTarget(children));
}

const cardTarget: DropTargetSpec<DNDTabProps> = {
	drop(props, monitor) {
		const dragKey = monitor.getItem().index;
		const hoverKey = props.index;

		if (dragKey === hoverKey) {
			return;
		}

		props.moveTabNode(dragKey, hoverKey);
		monitor.getItem().index = hoverKey;
	},
};

const cardSource: DragSourceSpec<DNDTabProps> = {
	beginDrag(props) {
		return { index: props.index };
	},
};

const WrapTabNode = DropTarget(IDENTIFIER, cardTarget, (connect) => ({
	connectDropTarget: connect.dropTarget(),
}))(
	DragSource<DNDTabProps>(IDENTIFIER, cardSource, (connect, monitor) => ({
		connectDragSource: connect.dragSource(),
		isDragging: monitor.isDragging(),
	}))(TabNode)
);

export function DraggableTabs(props: TabsProps): JSX.Element {
	const [tabOrder, setTabOrder] = useState<{ order: Array<string> }>({
		order: [],
	});
	const { children } = props;

	const moveTabNode = (dragKey: string, hoverKey: string) => {
		const newOrder = tabOrder.order.slice();

		React.Children.forEach(children as JSX.Element, (c) => {
			if (newOrder.indexOf(c.key as string) === -1) {
				newOrder.push(c.key as string);
			}
		});

		const dragIndex = newOrder.indexOf(dragKey);
		const hoverIndex = newOrder.indexOf(hoverKey);

		newOrder.splice(dragIndex, 1);
		newOrder.splice(hoverIndex, 0, dragKey);

		setTabOrder({
			order: newOrder,
		});
	};

	const renderTabBar = (props, DefaultTabBar) => (
		<DefaultTabBar {...props}>
			{(node) => (
				<WrapTabNode key={node.key} index={node.key} moveTabNode={moveTabNode}>
					{node}
				</WrapTabNode>
			)}
		</DefaultTabBar>
	);

	const tabs: Array<JSX.Element> = [];
	React.Children.forEach(children as JSX.Element, (c) => {
		tabs.push(c);
	});

	const orderTabs = tabs.slice().sort((a, b) => {
		const orderA = tabOrder.order.indexOf(a.key as string);
		const orderB = tabOrder.order.indexOf(b.key as string);

		if (orderA !== -1 && orderB !== -1) {
			return orderA - orderB;
		} else if (orderA !== -1) {
			return -1;
		} else if (orderB !== -1) {
			return 1;
		}

		const ia = tabs.indexOf(a);
		const ib = tabs.indexOf(b);

		return ia - ib;
	});

	return (
		<DndProvider backend={HTML5Backend}>
			<Tabs renderTabBar={renderTabBar} {...props}>
				{orderTabs}
			</Tabs>
		</DndProvider>
	);
}

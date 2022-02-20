import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { ResultViewer } from "./ResultViewer";
import { ObjectId } from "bson";

const createTestingBSON = (count) =>
	new Array(count).fill({
		_id: new ObjectId(),
		bool: true,
		num: 1,
		str: "Hello",
		date: new Date(),
		null: null,
		boolArray: [true, false, true],
		numArray: [1, 2, 3, 4],
		strArray: ["hello", "world"],
		dateArray: [new Date(), new Date()],
		nullArray: [null, null],
		subdocument: {
			bool: true,
			num: 1,
			str: "Hello",
			date: new Date(),
			null: null,
			boolArray: [true, false, true],
			numArray: [1, 2, 3, 4],
			strArray: ["hello", "world"],
			dateArray: [new Date(), new Date()],
			nullArray: [null, null],
		},
		subdocumentArray: [
			{
				_id: new ObjectId(),
				bool: true,
				num: 1,
				str: "Hello",
				date: new Date(),
				null: null,
				boolArray: [true, false, true],
				numArray: [1, 2, 3, 4],
				strArray: ["hello", "world"],
				dateArray: [new Date(), new Date()],
				nullArray: [null, null],
			},
			{
				_id: new ObjectId(),
				bool: true,
				num: 1,
				str: "Hello",
				date: new Date(),
				boolArray: [true, false, true],
				numArray: [1, 2, 3, 4],
				strArray: ["hello", "world"],
				dateArray: [new Date(), new Date()],
			},
		],
	});

export default {
	title: "Panes/ResultViewer",
	component: ResultViewer,
	decorators: [
		(Story) => (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
					background: "var(--primary-tint-3)",
				}}
			>
				<Story />
			</div>
		),
	],
} as ComponentMeta<typeof ResultViewer>;

const Template: ComponentStory<typeof ResultViewer> = (args) => (
	<ResultViewer {...args} />
);

export const TreeView = Template.bind({});
TreeView.args = {
	bson: createTestingBSON(1),
	type: "tree",
	code: "db.test.find()",
};

export const PlainView = Template.bind({});
PlainView.args = {
	bson: createTestingBSON(1),
	type: "json",
	code: "db.test.find()",
};

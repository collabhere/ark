import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { CollapseList } from "./CollapseList";
import { ObjectId } from "bson";
import { Button } from "./Button";
import { VscSettingsGear } from "react-icons/vsc";

export default {
	title: "Common/CollapseList",
	component: CollapseList,
	decorators: [
		(Story) => (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
					width: "100%",
					background: "beige",
				}}
			>
				<Story />
			</div>
		),
	],
} as ComponentMeta<typeof CollapseList>;

const Template: ComponentStory<typeof CollapseList> = (args) => (
	<CollapseList {...args} />
);

export const List = Template.bind({});
List.args = {
	content: new Array(10).fill("").map((_, key) => ({
		jsx: <div>Hello! {key}</div>,
		header: {
			title: String(key),
			key: key,
			rightElement: (
				<Button
					onClick={(e) => {
						e.stopPropagation();
					}}
					size={"small"}
					icon={<VscSettingsGear />}
				/>
			),
		},
	})),
};

export const NestedList = Template.bind({});
NestedList.args = {
	content: [
		{
			jsx: (
				<div>
					<div>Hello from outside!</div>
					<NestedList
						content={[
							{
								jsx: <div>Hello from inside!</div>,
								header: {
									key: "Hi",
									title: "Hi",
								},
							},
						]}
					/>
				</div>
			),
			header: {
				primary: true,
				key: 1,
				title: "outside 1",
			},
		},
		{
			jsx: (
				<div>
					<div>Hello from outside!</div>
					<NestedList
						content={[
							{
								jsx: <div>Hello from inside!</div>,
								header: {
									key: "Hi",
									title: "Hi",
								},
							},
						]}
					/>
				</div>
			),
			header: {
				primary: true,
				key: 2,
				title: "outside 2",
			},
		},
	],
};

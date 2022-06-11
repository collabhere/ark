import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Menu, MenuItem, MenuDivider } from "@blueprintjs/core";

import { Button } from "./Button";

export default {
	title: "Common/Button",
	component: Button,
	argTypes: {
		backgroundColor: { control: "color" },
	},
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
	variant: "primary",
	shape: "circle",
	text: "Example Button",
	size: "large",
};

export const DropdownButton = Template.bind({});
DropdownButton.args = {
	variant: "primary",
	shape: "circle",
	text: "Dropdown Button",
	size: "large",
	dropdownOptions: {
		content: (
			<Menu>
				<MenuItem icon="new-text-box" onClick={() => {}} text="New text box" />
				<MenuItem icon="new-object" onClick={() => {}} text="New object" />
				<MenuItem icon="new-link" onClick={() => {}} text="New link" />
				<MenuDivider />
				<MenuItem text="Settings..." icon="cog">
					<MenuItem icon="tick" text="Save on edit" />
					<MenuItem icon="blank" text="Compile on edit" />
				</MenuItem>
			</Menu>
		),
	},
};

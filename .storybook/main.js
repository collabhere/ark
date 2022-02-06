module.exports = {
	stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
	addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
	framework: "@storybook/react",
	core: {
		builder: "webpack5",
	},
	webpackFinal: async (config, { configType }) => {
		// `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
		// 'PRODUCTION' is used when building the static version of storybook.

		config.module.rules.push({
			test: /\.less$/,
			use: [
				require.resolve("style-loader"),
				require.resolve("css-loader"),
				require.resolve("less-loader"),
			],
		});

		return config;
	},
};

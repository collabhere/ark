import { defineConfig, loadEnv } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import svgr from "vite-plugin-svgr";
import eslintPlugin from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, "./");
	const htmlEnvPlugin = () => {
		return {
			name: "html-transform",
			transformIndexHtml(html: string) {
				return html.replace(/<%=(.*?)%>/g, function (match, p1) {
					return env[p1];
				});
			},
		};
	};
	return {
		base: "./",
		// This changes the out put dir @from dist to build
		// comment this out if that isn't relevant for your project
		build: {
			outDir: "build",
		},
		css: {
			preprocessorOptions: {
				less: {
					javascriptEnabled: true,
				},
			},
		},
		plugins: [reactRefresh(), svgr(), eslintPlugin(), htmlEnvPlugin()],
	};
});

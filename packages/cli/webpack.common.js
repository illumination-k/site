module.exports = {
	entry: "./index.ts",
	target: "node",
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: ["swc-loader"],
				exclude: /node_modules/,
			},
			{
				test: /\.node$/,
				use: "node-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".ts", ".js", ".node"],
	},
	externals: {
		sharp: "commonjs sharp",
	},
};

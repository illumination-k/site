const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
	mode: "development",
	devtool: "inline-source-map",
	optimization: {
		runtimeChunk: true,
		removeAvailableModules: false,
		removeEmptyChunks: false,
		splitChunks: false,
	},
});

module.exports = {
  entry: "./index.ts",
  target: "node",

  resolve: {
    extensions: [".ts", ".js", ".node"],
  },
  externals: {
    "sharp": "commonjs sharp",
  },
};

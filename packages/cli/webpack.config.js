module.exports = {
  entry: "./index.ts",
  target: "node",
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ["ts-loader"],
        exclude: /node_modules/,
      },
      { test: /\.node$/, use: "node-loader" },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".node"],
  },
  externals: {
    "sharp": "commonjs sharp",
  },
};

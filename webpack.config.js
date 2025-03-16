const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: './src/game.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
        new CopyPlugin({
      patterns: [
        { from: "src/assets", to: "assets" }
      ],
    }),
  ],
  devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
    compress: true,
    port: 8080,
  },
    mode: 'development' // Or 'production'
};
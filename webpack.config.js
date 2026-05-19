const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './web-app.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
    clean: true,
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
            plugins: [
              ['@babel/plugin-transform-class-properties', { loose: true }],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: false,
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.EXPO_PUBLIC_DESCOPE_PROJECT_ID': JSON.stringify(process.env.EXPO_PUBLIC_DESCOPE_PROJECT_ID || ''),
      'process.env': JSON.stringify({}),
    }),
    new HtmlWebpackPlugin({
      template: './public/index-template.html',
      filename: 'index.html',
    }),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native/': 'react-native-web/',
    },
    modules: [path.resolve(__dirname), 'node_modules'],
  },
  devServer: {
    port: 3000,
    historyApiFallback: true,
  },
};

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: [
        'regenerator-runtime/runtime.js',
        './src/main.js',
    ],
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'build'),
        clean: true,
        publicPath: 'auto'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude :/node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        cacheDirectory: true,
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                    }
                },
            },
        ],
    },
    cache: {
        type: 'filesystem',
    },
    optimization: {
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
            },
          },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/app.html',
            filename: 'app.html'
        }),
        new ReplaceInFileWebpackPlugin([{
            test: /vendors.*/,
            rules: [{
                search: /\{À:"A",Á:"A",(.*?)\}/,
                replace: ''
            }]
        }])
    ],
    // Uncomment this for improved debugging messages
    // devtool: 'inline-source-map',
};

const path = require('path');
const webpack = require('webpack');

module.exports = {
    context: __dirname + '/source',

    cache: true,
    devtool: 'source-map',
    plugins: [],

    entry: {
        'gltf-loader': ['gltf-loader.ts']
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name].js',
        library: 'GltfLoader',
        libraryTarget: 'window'

    },
    resolve: {
        modules: [__dirname + '/node_modules', __dirname + '/source'],
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                include: /source/,
                exclude: /(example|node_modules)/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: {
                            noUnusedLocals: false,
                            removeComments: true
                        }
                    }
                }
            },
        ]
    }
};

if (process.env.ANALYZE) {
    const analyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    module.exports.plugins.push(new analyzer());
}

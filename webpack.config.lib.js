
module.exports = require('./webpack.config');

module.exports.entry = {
    '../lib/gltf-loader': ['gltf-loader.ts']
};

module.exports.module.rules[0].use = {
    loader: 'ts-loader',
    options: {
        compilerOptions: {
            declaration: true,
            removeComments: true
        }
    }
};

module.exports.output.library = undefined;
module.exports.output.libraryTarget = 'commonjs2';

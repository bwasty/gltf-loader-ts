
module.exports = require('./webpack.config');

module.exports.entry = {
    'gltf-loader': ['gltf-loader.ts'],
    'gltf-loader.min': ['gltf-loader.ts'],
};

module.exports.module.rules[0].use = {
    loader: 'ts-loader',
    options: {
        compilerOptions: {
            removeComments: true
        }
    }
};

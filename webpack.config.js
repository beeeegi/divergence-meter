const path = require('path');

module.exports = {
    mode: 'development',
    entry: './renderer.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    }
};
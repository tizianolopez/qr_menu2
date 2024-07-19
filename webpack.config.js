const path = require('path')

module.exports = {
    mode: 'development',
    entry: './src/inde.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    watch: true
}
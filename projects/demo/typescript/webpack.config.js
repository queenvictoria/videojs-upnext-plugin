const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const glob = require('glob');

const entryFiles = {};
glob.sync('./src/*.ts').forEach((file) => {
  const name = path.basename(file, '.ts');
  entryFiles[name] = file;
});

module.exports = {
  mode: 'development',
  entry: entryFiles,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/*.html', to: '[name][ext]' },
        { from: 'src/index.css', to: 'index.css' },
        { from: 'src/upnext-styles.min.css', to: 'upnext-styles.min.css' }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    port: 3000,
    watchFiles: ['src/**/*']
  }
};

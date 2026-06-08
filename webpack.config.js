const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      'h5p-paint': './src/entries/dist.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true
    },
    devtool: isProduction ? false : 'source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules\/(?!fabric)/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader'
          ]
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css'
      })
    ],
    resolve: {
      alias: {
        fabric: 'fabric/dist/fabric.min.js'
      }
    },
    performance: {
      hints: false
    }
  };
};

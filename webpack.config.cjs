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
    optimization: {
      usedExports: isProduction,
      sideEffects: true
    },
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
            {
              loader: 'sass-loader',
              options: {
                api: 'modern'
              }
            }
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
      fallback: {
        canvas: false,
        fs: false,
        jsdom: false,
        http: false,
        https: false,
        url: false,
        'jsdom/lib/jsdom/living/generated/utils': false,
        'jsdom/lib/jsdom/utils': false
      }
    },
    performance: {
      hints: false
    }
  };
};

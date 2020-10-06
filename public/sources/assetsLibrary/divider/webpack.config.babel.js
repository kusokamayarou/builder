import path from 'path'
import webpack from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import TerserWebpackPlugin from 'terser-webpack-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
export default Object.assign({}, {
  mode: 'production',
  entry: {
    divider: [ './src/css/styles.less' ]
  },
  output: {
    path: path.resolve(process.cwd(), 'dist/'),
    // Assets dist path
    publicPath: '.',
    // Used to generate URL's
    filename: '[name].bundle.js',
    // Main bundle file
    chunkFilename: '[name].bundle.js',
    jsonpFunction: 'vcvWebpackJsonp4x'
  },
  node: {
    fs: 'empty'
  },
  optimization: {
    minimize: true,
    runtimeChunk: false,
    namedModules: true,
    minimizer: [new TerserWebpackPlugin({
      terserOptions: {
        safari10: true
      }
    }), new OptimizeCSSAssetsPlugin()]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].bundle.css'
    }),
    new webpack.NamedModulesPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ],
  module: {
    rules: [
      {
        parser: {
          amd: false
        }
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      },
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader'
        },
        exclude: /node_modules/
      },
      {
        test: /\.css|\.less$/,
        exclude: [/styles\.css/, /editor\.css/],
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: function plugins () {
                return [require('autoprefixer')()];
              }
            }
          },
          'less-loader'
        ]
      },
      {
        test: /\.svg/,
        use: {
          loader: 'svg-url-loader',
          options: {}
        }
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        use: 'url-loader?limit=10000&name=/images/[name].[ext]?[hash]'
      }, // inline base64 URLs for <=8k images, direct URLs for the rest.
      {
        test: /\.woff(2)?(\?.+)?$/,
        use: 'url-loader?limit=10000&mimetype=application/font-woff&name=/fonts/[name].[ext]?[hash]'
      }, {
        test: /\.(ttf|eot)(\?.+)?$/,
        use: 'file-loader?name=/fonts/[name].[ext]?[hash]'
      }, {
        test: /\.raw(\?v=\d+\.\d+\.\d+)?$/,
        use: 'raw-loader' // { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery&$=jquery' }
      }
    ]
  }
})

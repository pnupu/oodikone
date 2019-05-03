const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const htmlTemplate = require('html-webpack-template')
const TerserPlugin = require('terser-webpack-plugin')
const DeadCodePlugin = require('webpack-deadcode-plugin')

const devServerPort = 8081
const apiServerPort = 8080
const apiAddress = process.env.BACKEND_ADDR || 'localhost'
const backendURL = `http://${apiAddress}:${apiServerPort}`

module.exports = (env, args) => {
  const { mode } = args
  const isDev = mode === 'development'
  return {
    entry: [
      'babel-polyfill',
      './src/app'
    ],
    resolve: {
      extensions: ['.js', '.jsx']
    },
    module: {
      rules: [
        { // Load JS files
          test: /\.js$|.jsx$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },
        { // Load CSS files
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        { // Load other files
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
          use: ['file-loader']
        }
      ]
    },
    plugins: [
      new DeadCodePlugin({
        exclude: [
          '**/node_modules/**',
          '**/*.(storybook|spec).(js|jsx)'
        ]
      }),
      new HtmlWebpackPlugin({
        inject: false,
        template: htmlTemplate,
        appMountId: 'root',
        title: 'Oodikone'
      }),
      new webpack.DefinePlugin({
        CONFIG: {
          BASE_PATH: JSON.stringify(''),
          AUTH_PROFILE: JSON.stringify(mode)
        },
        'process.env': {
          NODE_ENV: JSON.stringify(mode),
          ANALYTICS_ADMINER_URL: JSON.stringify(process.env.ANALYTICS_ADMINER_URL),
          USER_ADMINER_URL: JSON.stringify(process.env.USER_ADMINER_URL),
          ADMINER_URL: JSON.stringify(process.env.ADMINER_URL),
          USAGE_ADMINER_URL: JSON.stringify(process.env.USAGE_ADMINER_URL)
        }
      }),
      new MiniCssExtractPlugin()
    ],
    optimization: {
      minimizer: [new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
      })]
    },
    devtool: isDev ? 'eval-source-map' : 'source-map',
    devServer: {
      historyApiFallback: true,
      port: devServerPort,
      proxy: [
        {
          context: ['/api/**'],
          target: backendURL
        }
      ]
    }
  }
}

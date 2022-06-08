const path = require('path');

const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode : 'production',
  entry: './server/index.js',
  devtool: 'eval-source-map',
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'server/bundle')
  },
  target : 'node',
  externals : [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}

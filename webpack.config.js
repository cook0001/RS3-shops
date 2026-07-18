const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|jpeg|gif|webp)$/i,
        type: 'javascript/auto',
        use: [
          {
            loader: '@alt1/imagedata-loader',
          },
        ],
      },
      {
        test: /\.fontmeta.json/,
        use: [
          {
            loader: '@alt1/font-loader',
          },
        ],
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "util": false,
      "path": false,
      "fs": false,
      "crypto": false
    }
  },
  externals: {
    'sharp': 'commonjs sharp',
    'canvas': 'commonjs canvas'
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development'
};

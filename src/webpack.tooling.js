import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import Autoprefixer from 'autoprefixer';
import CssMinimizerWebpackPlugin from 'css-minimizer-webpack-plugin';

export const autoprefix = () => ({
  loader: 'postcss-loader',
  options: {
    postcssOptions: {
      plugins: () => [Autoprefixer()],
    },
    sourceMap: true,
  },
});

export const lintJS = () => ({

  module: {
    rules: [
      {
        test: /\.m?js$/,
        enforce: 'pre',
        use: 'eslint-loader',
      },
    ],
  },
});

export const transpileJS = ({ id, suffix = '', entry, include, babelTargets }) => ({
  entry,
  output: {
    chunkFilename: `[chunkhash]-[name]${suffix}.js`,
    filename: `[name]${suffix}.js`,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        include,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory : `.babel-loader-caches/${id}`,
            presets: [
              ['@babel/preset-env', {
                targets: babelTargets,
              }]
            ]
          }
        },
      },
    ],
  },
});


export const copyLocalImages = ({ dest } = {}) => ({
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{
        from: 'app/assets/images',
        to: dest,
      }]
    }),
  ],
});

export const extractCSS = ({ entry, resolverPaths } = {}) => ({
  entry,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false,
              sourceMap: true,
            },
          },
          autoprefix(),
        ],
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false,
              sourceMap: true,
            },
          },
          autoprefix(),
          {
            loader: 'less-loader',
            options: {
              sourceMap: true,
            },
          
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
});


export const minify = () => ({
  optimization: {
    minimizer: [
      `...`, // default minimizers
      new CssMinimizerWebpackPlugin(),
    ],
  },
});


export const generateSourceMaps = (devtool) => ({
  devtool,
});


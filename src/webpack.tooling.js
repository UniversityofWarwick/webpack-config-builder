import CopyWebpackPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import Autoprefixer from 'autoprefixer';
import CssNano from 'cssnano';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import PostCssSafeParser from 'postcss-safe-parser';

export const autoprefix = () => ({
  loader: 'postcss-loader',
  options: {
    plugins: () => [Autoprefixer()],
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

export const transpileJS = ({ id, prefix = '', entry, include, babelTargets } = {}) => ({
  entry,
  output: {
    chunkFilename: `[name]${prefix}.js`,
    filename: `[name]${prefix}.js`,
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
    new CopyWebpackPlugin([{
      from: 'app/assets/images',
      to: dest,
    }]),
  ],
});

export const extractCSS = ({ resolverPaths } = {}) => ({
  entry: {
    style: './app/assets/css/main.less',
  },
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
              paths: resolverPaths,
              relativeUrls: false,
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
      new TerserPlugin({
        sourceMap: true,
        cache: true,
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new OptimizeCssAssetsPlugin({
        cssProcessor: CssNano,
        cssProcessorOptions: {
          parser: PostCssSafeParser,
          discardComments: {
            removeAll: true,
          },
        },
        canPrint: true,
      }),
    ],
  },
});


export const generateSourceMaps = (devtool) => ({
  devtool,
});


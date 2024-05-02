import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import Autoprefixer from 'autoprefixer';
import CssMinimizerWebpackPlugin from 'css-minimizer-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';

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
  plugins: [new ESLintPlugin()]
});

function getLoaders({ id, include, babelTargets, useTypescript }) {
  const rules = [];
  if (useTypescript ?? true) {
    rules.push({
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    });
  }
  rules.push({
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
  });
  return rules;
}

export const transpileJS = ({ id, suffix = '', entry, include, useTypescript, babelTargets }) => ({
  entry,
  output: {
    chunkFilename: `[chunkhash]-[name]${suffix}.js`,
    filename: `[name]${suffix}.js`,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '...']
  },
  module: {
    rules: getLoaders({ id, include, babelTargets, useTypescript }),
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
              lessOptions: {
                // UTL-351
                // This is the LESS default but defaults to true in less-loader.
                // False means relative url() paths are left alone, which is what we want
                // as our ID7 and FA5 setup expect them to already be relative to output
                // files that we will put into place, and don't resolve at built time to
                // an asset. 
                relativeUrls: false,
              }
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


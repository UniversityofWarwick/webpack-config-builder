
// Node modules
import path from 'path';
import fs from 'fs';

// External modules
import merge from 'webpack-merge';
import webpack, { DefinePlugin, ProgressPlugin, ProvidePlugin } from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import WebpackNotifierPlugin from 'webpack-notifier';

// Internal modules
import * as tooling from './webpack.tooling';
import PlayFingerprintsPlugin from './PlayFingerprintsPlugin';
import StaticHashesPlugin from './StaticHashesPlugin';

/**
* @typedef {Object} BrowserLevel
* @property {string} id - Identifier used for cache names etc.
* @property {string} suffix - appended to bundle names - can be empty but must be unique.
* @property {any} babelTargets - String or object to pass to babel-env targets property.
*/

/**
 * @typedef {Object} MomentTimezoneOptions
 * @property {number} startYear
 * @property {number} endYear
 * @property {string|string[]|RegExp|RegExp[]} [matchZones]
 */

const BROWSER_LEVELS = {
  // Default base level,
  es5: {
    id: 'es5',
    suffix: '',
    babelTargets: '> 0.25%, not dead, ie 11',
  },
};

const DEFAULT_CONFIGURATION = {
  assetsRoot: './src/main/assets',
  outputPath: undefined,
  publicPath: '/assets/',
};

/**
 * A builder pattern for Webpack config. Each call mutates the builder to change the options.
 *
 * Because we don't actually put the config together until you call build(), it shouldn't matter
 * what order you call them in.
 *
 * If you have two sets of things to build with nothing in common then it should be fine to concat
 * their results eg:
 *
 *     const config = [ ...builder1.build(), ... builder2.build() ];
 */
export default class Builder {
  constructor() {
    /**
    * @type {BrowserLevel[]}
    * @private
    */
    this.browserLevels = [BROWSER_LEVELS.es5];

    /**
    * @type {{from: string, to: string}[]}
    * @private
    */
    this.copyModules = [];

    /**
     * @type {boolean}
     * @private
     */
    this.useExternalJquery = true;

    /**
     * @type {Object.<string, string>}
     * @private
     */
    this.javascriptEntries = {};

    /** @private */
    this.play = false;

    /** @private */
    this.assetsRoot = './src/main/assets';

    /**
     * Set either manually, or at build time if left undefined
     * @private
     */
    this.styleEntries = undefined;

    /**
     * @type {Object.<string, string>}
     * @private
     */
    this.copyAssetPaths = {};

    /**
     * @type {MomentTimezoneOptions}
     * @private
     */
    this._momentTimezoneOptions = {
      startYear: 2020,
      endYear: (new Date()).getFullYear() + 3
    };
  }

  /**
   * @param {String} assetsRoot
   * @param {String} outputPath
   * @param {String} publicPath
   */
  configure({ assetsRoot, outputPath, publicPath } = DEFAULT_CONFIGURATION) {
    // check cwd before you wreck cwd
    try {
      fs.statSync(path.join(process.cwd(), assetsRoot));
    } catch (e) {
      throw new Error(`${assetsRoot} not found, are you in the right directory?`);
    }

    this.assetsRoot = assetsRoot;
    this.outputPath = outputPath;
    this.publicPath = publicPath;
    return this;
  }

  /**
  * Specify that this project uses our standard Play layout,
  */
  playApp() {
    this.play = true;

    return this.configure({
      assetsRoot: './app/assets',
      outputPath: path.join(process.cwd(), 'target/assets'),
      publicPath: '/assets/',
    });
  }

  /**
   * @deprecated Use {@link springBootApp}, default values may change in future
   */
  springApp() {
    return this.springBootApp();
  }

  springBootApp() {
    return this.configure({
      assetsRoot: './src/main/assets',
      outputPath: path.join(process.cwd(), 'build/resources/main/static/assets'),
      publicPath: '/assets/',
    });
  }

  /**
   * By default there is one browser target generating ES5 code, which you can add to with
   * addBrowserLevel.
   *
   * If the default browser targets are not appropriate for you, you can clear the collection
   * and just add the ones you want. This might be the case when you're generating a bundle that's
   * just for modern browsers.
   */
  clearBrowserLevels() {
    this.browserLevels = [];
    return this;
  }

  /**
  * @param {BrowserLevel} level
  */
  addBrowserLevel(level) {
    if (level.prefix) {
      // it was always a suffix but was misnamed
      throw new Error('prefix has been renamed to suffix, update your browser level definition');
    }
    this.browserLevels.push(level);
    return this;
  }

  /**
   * @param {Object.<string, string>} entries
   */
  jsEntries(entries) {
    this.javascriptEntries = entries;
    return this;
  }

  /**
   * @param {Object.<string, string>} entries
   */
  cssEntries(entries) {
    this.styleEntries = entries;
    return this;
  }

  /**
   * @param {Object.<string, string>} paths
   */
  copyAssets(paths) {
    this.copyAssetPaths = paths;
    return this;
  }

  /**
  * Choose whether to use an externally provided global jQuery (replacing any imports),
  * or whether to import our own jquery module (which will get exposed to any module that
  * expects it as a global).
  *
  * Defaults to true, since we typically include the ID7 bundle
  *
  * @param {boolean} use
  */
  externalJquery(use) {
    this.useExternalJquery = use;
    return this;
  }

  /**
  * Copy the contents of an NPM module to a destination path
  *
  * @param {string} module
  * @param {string} sourcePath
  * @param {string} destPath
  */
  copyModule(module, sourcePath, destPath) {
    this.copyModules.push({
      from: `node_modules/${module}/${sourcePath}`,
      to: path.join(this.outputPath, destPath)
    });
    return this;
  }

  /**
   * Override the default options for moment-timezone-data-webpack-plugin
   *
   * @param {MomentTimezoneOptions} options
   */
  setMomentTimezoneOptions(options) {
    this._momentTimezoneOptions = options;
    return this;
  }

  /**
   * Limit the years of TZ data to include. Often you might set this to
   * the inception date of your app, so that it can handle historical data.
   *
   * @param {number} year - Start year for TZ data
   * @param {*} [extraYears=3] - How many extra years of data to include
   */
  momentTimezonesFrom(year, extraYears) {
    this._momentTimezoneOptions.startYear = year;
    this._momentTimezoneOptions.endYear = year + (extraYears || 3);
    return this;
  }

  /**
   * Limits TZ data to London only which is recommended if you don't
   * actually need to deal with lots of zones in your app.
   */
  momentTimezonesLondonOnly() {
    this._momentTimezoneOptions.matchZones = 'Europe/London';
    return this;
  }


  /**
  * Builds and returns an array of Webpack configurations that can be exported.
  * @returns {Object[]}
  */
  build() {

    for (const jsKey in this.javascriptEntries) {
      for (const cssKey in this.styleEntries) {
        if (jsKey === cssKey) {
          throw new Error(`Conflicting JS and CSS entrypoints both called ${jsKey} - one would overwrite the other. Rename one.`)
        }
      }
    }

    /**
     * @param {Object} options
     * @param {boolean} options.first - If true, will run certain once-only tasks to avoid doing the same stuff multiple times needlessly.
     * @param {BrowserLevel} options.buildOptions
     * @returns {webpack.Configuration}
     */
    const commonConfig = ({ first, buildOptions: { id, suffix, babelTargets } }) => {
      const plugins = [
        new ProgressPlugin(),
        new DefinePlugin({
          BUILD_LEVEL: JSON.stringify(id)
        }),
        // Fix Webpack global CSP violation https://github.com/webpack/webpack/issues/6461
        new ProvidePlugin({
          global: require.resolve('./global.js'),
        }),
      ];

      try {
        // fails if project isn't using moment
        const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
        const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin');
        const thisYear = (new Date()).getFullYear();
        plugins.push(new MomentLocalesPlugin({ localesToKeep: ['en-gb'] }));
        plugins.push(new MomentTimezoneDataPlugin(this._momentTimezoneOptions));
      } catch {}

      if (typeof this.styleEntries === 'undefined') {
        this.styleEntries = this.styleEntries = {
          style: `${this.assetsRoot}/css/main.less`,
        };
      }

      return merge([
        {
          output: {
            path: this.outputPath,
            publicPath: this.publicPath,
          },
          node: {
            // Fix Webpack global CSP violation https://github.com/webpack/webpack/issues/6461
            global: false,
          },
          plugins,
        },
        this.useExternalJquery ? {
          // jQuery is a global, replace imports of jquery with references to it
          externals: {
            jquery: 'jQuery'
          }
        } : {
          // Replace references to global jQuery with an import of jquery
          plugins: [
            new ProvidePlugin({
              jQuery: 'jquery',
              $: 'jquery',
            })
          ]
        },
        first ? tooling.lintJS() : {},
        tooling.transpileJS({
          id,
          suffix,
          entry: this.javascriptEntries,
          babelTargets,
        }),
        first && this.copyModules.length ? {
          plugins: [
            new CopyWebpackPlugin({ patterns: this.copyModules }),
          ],
        } : {},
        first && this.play ? tooling.copyLocalImages({
          dest: this.outputPath,
        }) : {},
        first && Object.keys(this.copyAssetPaths).length ? {
          plugins: [
            new CopyWebpackPlugin({
              patterns: Object.entries(this.copyAssetPaths).map(([destPath, from]) => {
                return {
                  from,
                  to: path.join(this.outputPath, destPath),
                };
              })
            }),
          ],
        } : {},
        tooling.extractCSS({
          entry: this.styleEntries,
          resolverPaths: [
            'node_modules',
          ],
        }),
        // This is intentionally at the end so that copies get fingerprinted too
        {
          plugins: [
            this.play ? new PlayFingerprintsPlugin() : new StaticHashesPlugin(),
          ],
        },
      ])
    };

    /** @type {webpack.Configuration} */
    const productionConfig = merge([
      {
        mode: 'production',
      },
      tooling.minify(),
      tooling.generateSourceMaps('source-map'),
    ]);

    /** @type {webpack.Configuration} */
    const developmentConfig = merge([
      {
        mode: 'development',
        plugins: [
          new WebpackNotifierPlugin(),
        ],
      },
      tooling.generateSourceMaps('cheap-module-source-map'),
    ]);


    return ({ production } = {}) => {
      const config = production ? productionConfig : developmentConfig;
      return this.browserLevels.map((browserLevel, i) =>
        merge(commonConfig({ buildOptions: browserLevel, first: i === 0 }), config)
      );
    };
  }
}

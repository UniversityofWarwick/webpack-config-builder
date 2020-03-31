
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

/**
* @typedef {Object} BrowserLevel
* @property {string} id - Identifier used for cache names etc.
* @property {string} prefix - appended to bundle names - can be empty but must be unique.
* @property {any} babelTargets - String or object to pass to babel-env targets property.
*/

/**
* @type {Object.<string, BrowserLevel>}
*/ 
const BROWSER_LEVELS = {
  // Default base level, 
  es5: {
    id: 'es5',
    prefix: '',
    babelTargets: '> 0.25%, not dead, ie 11',
  },
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
    
    /** @type {boolean} */
    this.useExternalJquery = true;

    /** @type {Object.<string, string>} */
    this.javascriptEntries = {};

    this.play = false;
  }
  
  /**
  * Specify that this project uses our standard Play layout, 
  */
  playApp() {
    // check cwd before you wreck cwd
    try {
      fs.statSync(path.join(process.cwd(), 'app/assets'));
    } catch (e) {
      throw new Error('app/assets not found, are you in the right directory?');
    }
    
    this.play = true;
    this.outputPath = path.join(process.cwd(), 'target/assets');
    this.publicPath = '/assets/';
    return this;
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
  * Choose whether to use an externally provided global jQuery (replacing any imports),
  * or whether to import our own jquery module (which will get exposed to any module that
    * expects it as a global).
    * 
    * Defaults to true, since we typically 
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
    * Builds and returns an array of Webpack configurations that can be exported.
    * @returns {Object[]}
    */
    build() {
      /**
       * 
       * @param {Object} options
       * @param {boolean} options.first - If true, will run certain once-only tasks to avoid doing the same stuff multiple times needlessly.
       * @param {BrowserLevel} options.buildOptions
       * @returns {webpack.Configuration}
       */
      const commonConfig = ({ first, buildOptions: { id, prefix, babelTargets } }) => {
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
          plugins.push(new MomentLocalesPlugin({ localesToKeep: ['en-gb'] }));
        } catch {}

        if (this.play) {
          plugins.push(new PlayFingerprintsPlugin());
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
            prefix,
            entry: this.javascriptEntries,
            babelTargets,
          }),
          first && this.copyModules.length ? {
            plugins: [
              new CopyWebpackPlugin(this.copyModules),
            ],
          } : {},
          first ? tooling.copyLocalImages({
            dest: this.outputPath,
          }) : {},
          tooling.extractCSS({
            resolverPaths: [
              'node_modules',
            ],
          }),
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
        merge(commonConfig({ buildOptions: browserLevel, first: i == 0 }), config)
        );
      };
    }
  }
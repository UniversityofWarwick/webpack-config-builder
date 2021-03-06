/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
import { createHash } from 'crypto';

import webpack from 'webpack';

/**
 * Webpack plugin that generates some extra files for Play! Framework
 * to use to generate versioned assets.
 *
 * It calculates the MD5 hash of each source and then:
 * Adds a .md5 file containing that hash
 * Adds a HASH-FILENAME copy of the original file.
 *
 * Logic based on the gulp-play-assets module.
 */
export default class PlayFingerprintsPlugin {
  constructor(options) {
    this.options = options || {};
  }

  /**
   * @param {webpack.Compiler} compiler 
   */
  apply(compiler) {
    compiler.hooks.emit.tapAsync('PlayFingerprintsPlugin', (compilation, done) => {
      const { assets } = compilation;
      const logger = compilation.getLogger('PlayFingerprintsPlugin');
      const versionedFilenames = {};

      for (const filename in assets) {
        if (Object.prototype.hasOwnProperty.call(assets, filename)) {
          const dynamicChunk = filename.match(/^([a-z0-9]{20})-(.+.js(\.map)?)$/);
          if (dynamicChunk) {
            // This is a dynamic chunk that uses [chunkhash]
            // in its filename already - so reverse engineer the .md5 file
            // to allow the Gulp script to find the fingerprinted version.
            const hash = dynamicChunk[1];
            const name = dynamicChunk[2];
            logger.info('Processing dynamic chunk with hash and name', hash, name);
            assets[`${name}.md5`] = {
              source: () => hash,
              size: () => hash.length,
            };

            // don't really need this, but Play seems not to serve the file
            // unless the non-fingerprinted version exists.
            assets[`${name}`] = assets[filename];
          } else {
            const hash = createHash('md5');
            hash.update(assets[filename].source());
            const md5 = hash.digest('hex');

            // Identical to original file but with hash prepended.
            assets[`${md5}-${filename}`] = assets[filename];

            // Fingerprint .md5 file
            assets[`${filename}.md5`] = {
              source: () => md5,
              size: () => md5.length,
            };

            versionedFilenames[filename] = `${md5}-${filename}`;
          }
        }
      }

      done();
    });
  }
}

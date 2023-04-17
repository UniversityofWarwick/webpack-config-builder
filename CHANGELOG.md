# Notable changes

* 5.1.0 - Converted fully to an ES module. This means in a recent Node versions, it
  can only be imported by another ES module, so your Webpack config file needs to run
  as an ES module. The easiest way to do this is to name it `webpack.config.mjs`. If
  you call it `webpack.config.babel.js` you will need to make sure that the Babel config
  keeps the `import` syntax and doesn't transpile it to.

  I've done this because with recent Node versions we keep on bumping up against errors
  where it refuses to import an ES module from a non-ES module, so it's best for us to
  bite the bullet and join the world of the future.

  Using at least Node 16 LTS (or latest current LTS) is recommended, so that ES module
  support is available without commandline flags.
* 5.0.0 - Updated to use Webpack 5 and other latest libraries. 
  Versioning updated so that the major version matches Webpack's.
  You may need to upgrade any related dependencies that your project
  has to match what this plugin now uses, as there's no way in package.json
  to express a dependency that should be exposed directly to application code.
* 1.0.4 - Misnamed `prefix` changed to `suffix` in browser level configuration. You may need to update your config. It will throw an error if `prefix` is found, to avoid confusing problems later.
# Notable changes

* 5.0.0 - Updated to use Webpack 5 and other latest libraries. 
  Versioning updated so that the major version matches Webpack's.
  You may need to upgrade any related dependencies that your project
  has to match what this plugin now uses, as there's no way in package.json
  to express a dependency that should be exposed directly to application code.
* 1.0.4 - Misnamed `prefix` changed to `suffix` in browser level configuration. You may need to update your config. It will throw an error if `prefix` is found, to avoid confusing problems later.
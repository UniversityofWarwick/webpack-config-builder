# webpack-config-builder

Reusable builder to tame our Webpack boilerplate.

## Requirements

Some NPM modules need to be directly installed in your project:

* `webpack-cli` to provide the `webpack` command
* `@babel/register` if you are using Webpack's Babel support (i.e. if your config filename contains `babel`)

## Example `webpack.config.babel.js`

There are various options - there should be enough JSDoc coming from the module that once you have created a builder instance you will get completion hints about what methods you can call.

```js
import * as builder from '@universityofwarwick/webpack-config-builder';

export default builder.create().playApp()
  .jsEntries({
      admin: './app/assets/js/admin.js',
      render: './app/assets/js/render.js',
  })
  .cssEntries({
      style: './app/assets/css/main.less',
      admin: './app/assets/css/admin.less',
  })
  .momentTimezonesFrom(2020)
  .momentTimezonesLondonOnly()
  .addBrowserLevel({ id: 'modern', suffix: '-modern',
    babelTargets: {
      chrome: '75',
      edge: '44',
      firefox: '70',
      safari: '11.0',
      samsung: '8.0',
    }
  })
  .copyModule('@universityofwarwick/id7', 'dist', 'lib/  id7')
  .copyModule('@fortawesome/fontawesome-pro','webfonts', 'lib/fontawesome-pro/webfonts')
  .build();
```
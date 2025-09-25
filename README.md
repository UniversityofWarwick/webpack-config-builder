# webpack-config-builder

Reusable builder to tame our Webpack boilerplate.

## Requirements

At least NPM 9 is required. If the Node version you are using has an older version you can run `npm i -g npm@^9`.

Some NPM modules need to be directly installed in your project, because of the way Node dependencies work:

```
npm install -D webpack webpack-cli @babel/core @babel/register @babel/preset-env css-loader less less-loader postcss-loader babel-loader babel-eslint
```

## Vue.js support

If you want to use Vue.js, you need to include `vue-loader` with the above dependencies. Also, you need to provide the builder with the `VueLoaderPlugin` directly (so it can be kept optional for those not using Vue.js):

```js
import { VueLoaderPlugin } from 'vue-loader';
...
    .vue(new VueLoaderPlugin())
    .build();
```

Currently only tested with Vue.js v3.

## Known issues

The current version of the eslint plugin is only compatible with eslint 8. [Issue][eslint-9-issue]

## Example `webpack.config.babel.js`

There are various options - there should be enough JSDoc coming from the module that once you have created a builder instance you will get completion hints about what methods you can call.

```js
import * as builder from '@universityofwarwick/webpack-config-builder';

export default builder.create().playApp()
  .jsEntries({
      admin: './app/assets/js/admin.ts',
      render: './app/assets/js/render.ts',
  })
  .cssEntries({
      style: './app/assets/css/main.less',
      admin: './app/assets/css/admin.less',
  })
  // adjust depending on your needs
  .momentTimezonesFrom(2020)
  .momentTimezonesLondonOnly()
  .addBrowserLevel({ id: 'modern', suffix: '-modern',
    babelTargets: {
      chrome: '110',
      edge: '110',
      firefox: '110',
      safari: '15.0',
      samsung: '15.0',
    }
  })
  .copyModule('@universityofwarwick/id7', 'dist', 'lib/  id7')
  .copyModule('@fortawesome/fontawesome-pro','webfonts', 'lib/fontawesome-pro/webfonts')
  .build();
```

[eslint-9-issue]: https://github.com/webpack-contrib/eslint-webpack-plugin/issues/251

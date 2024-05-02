import * as builder from '@universityofwarwick/webpack-config-builder';

export default builder.create()
  .springBootApp()
  .jsEntries({
    main: './src/main/assets/js/main.ts',
  })
  .cssEntries({
    style: './src/main/assets/css/main.less',
  })
  .addBrowserLevel({ id: 'modern', suffix: '-modern', babelTargets: {
    chrome: '100',
    edge: '100',
    firefox: '100',
    safari: '14.0',
  }})
  .copyModule('bootstrap', 'dist', 'lib/bootstrap-dist')
  .copyModule('@fortawesome/fontawesome-free', 'webfonts', 'lib/fontawesome-free/webfonts')
  .build();
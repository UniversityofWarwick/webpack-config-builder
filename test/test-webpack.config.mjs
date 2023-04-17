import { create } from '../dist/index.js';

export default create()
  .springBootApp()
  .jsEntries({
    main: './src/main/assets/js/main.js',
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
  .build();
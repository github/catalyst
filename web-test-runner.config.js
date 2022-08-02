import {esbuildPlugin} from '@web/dev-server-esbuild'

export default {
  files: ['test/*'],
  nodeResolve: true,
  plugins: [esbuildPlugin({ts: true, target: 'es2020'})]
}

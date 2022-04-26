import {esbuildPlugin} from '@web/dev-server-esbuild'

export default {
  files: ['test/*'],
  plugins: [esbuildPlugin({ts: true})]
}

import {esbuildPlugin} from '@web/dev-server-esbuild'

export default {
  files: ['test/*'],
  nodeResolve: true,
  concurrency: 1,
  testsFinishTimeout: 30000,
  plugins: [esbuildPlugin({ts: true, target: 'es2020'})],
  filterBrowserLogs: log => !log.args.some(arg => typeof arg === 'string' && arg.includes('Lit is in dev mode'))
}

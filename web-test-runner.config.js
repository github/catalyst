import {esbuildPlugin} from '@web/dev-server-esbuild'
import ts from 'typescript'

// esbuild only lowers legacy decorators, so compile test/standard with TypeScript's standard decorators first. Emit
// ES2020 so esbuild has nothing left to lower: its class lowering renames classes, and Catalyst derives tag names from
// class names.
const standardDecorators = {
  name: 'standard-decorators',
  transform(context) {
    if (!context.path.includes('/test/standard/')) return
    const {outputText} = ts.transpileModule(context.body, {
      fileName: context.path,
      compilerOptions: {
        experimentalDecorators: false,
        target: ts.ScriptTarget.ES2020,
        useDefineForClassFields: true,
        module: ts.ModuleKind.ESNext
      }
    })
    return {body: outputText}
  }
}

export default {
  files: ['test/*.ts', 'test/standard/*.ts'],
  nodeResolve: true,
  concurrency: 1,
  testsFinishTimeout: 30000,
  plugins: [standardDecorators, esbuildPlugin({ts: true, target: 'es2020'})],
  filterBrowserLogs: log => !log.args.some(arg => typeof arg === 'string' && arg.includes('Lit is in dev mode'))
}

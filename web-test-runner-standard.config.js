import ts from 'typescript'
import config from './web-test-runner.config.js'

// Tests that use Catalyst's decorators with the same syntax in both modes. They run here with standard decorators,
// and in web-test-runner.config.js with legacy decorators. test/standard has tests that need standard-only syntax.
export const sharedFiles = ['test/attr.ts', 'test/bind.ts', 'test/controller.ts', 'test/register.ts']

// esbuild only lowers legacy decorators, so compile tests with TypeScript's standard decorators first. Emit ES2020 so
// esbuild has nothing left to lower: its class lowering renames classes, and Catalyst derives tag names from class
// names.
const standardDecorators = {
  name: 'standard-decorators',
  transform(context) {
    if (!context.path.startsWith('/test/') || !context.path.endsWith('.ts')) return
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
  ...config,
  files: [...sharedFiles, 'test/standard/*.ts'],
  plugins: [standardDecorators, ...config.plugins]
}

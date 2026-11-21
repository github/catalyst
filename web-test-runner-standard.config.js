import ts from 'typescript'
import config from './web-test-runner.config.js'

// Tests that use Catalyst's decorators with the same syntax in both modes. They run here with standard decorators,
// and in web-test-runner.config.js with legacy decorators. test/standard has tests that need standard-only syntax.
export const sharedFiles = ['test/attr.ts', 'test/bind.ts', 'test/controller.ts', 'test/register.ts']

// Compile tests and source the way a modern TypeScript build does: standard decorators and native ES2022 class fields
// with define semantics. This replaces the esbuild plugin, which only lowers legacy decorators, and whose class lowering
// renames classes, which Catalyst derives tag names from.
const standardDecorators = {
  name: 'standard-decorators',
  resolveMimeType(context) {
    if (context.path.endsWith('.ts')) return 'js'
  },
  transform(context) {
    if (!/^\/(src|test)\/.*\.ts$/.test(context.path)) return
    const {outputText} = ts.transpileModule(context.body, {
      fileName: context.path,
      compilerOptions: {
        experimentalDecorators: false,
        target: ts.ScriptTarget.ES2022,
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
  plugins: [standardDecorators]
}

import {defineConfig} from 'vitest/config'
import {playwright} from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      instances: [
        {
          browser: 'chromium',
        },
      ],
      provider: playwright(),
      headless: true,
    },
    include: ['test/**/*.ts'],
    exclude: ['test/setup.ts', 'test/test-utils.ts'],
    setupFiles: ['./test/setup.ts'],
    globals: true,
  },
  esbuild: {
    target: 'es2020',
  },
})

import { defineConfig } from 'tsup'

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        constants: 'src/constants.ts',
        utils: 'src/utils.ts',
        schemas: 'src/schemas.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ['drizzle-orm', 'drizzle-zod', 'zod', 'clsx', 'tailwind-merge'],
    minify: false,
})
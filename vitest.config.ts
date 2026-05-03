import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
    resolve: {
        alias: {
            '@foodiefinds/shared': path.resolve(__dirname, 'packages/shared/src'),
        },
    },
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            reporter: ['text', 'html'],
            include: [
                'server/**/*.ts',
                'packages/shared/src/**/*.ts',
            ],
            exclude: ['**/*.test.ts'],
        },
    },
})

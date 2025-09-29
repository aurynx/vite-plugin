/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    test: {
        environment: 'node',
        include: ['test/**/*.test.ts'],
        typecheck: {
            tsconfig: 'tsconfig.vitest.json'
        },
        coverage: {
            include: ['src/**/*.ts'],
            exclude: [
                'src/types.ts',
                'src/**/index.ts',
            ],
        },
    },
});

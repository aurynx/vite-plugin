/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'aurynxVitePlugin',
            fileName: 'index',
            formats: ['es', 'cjs'],
        },
        minify: false,
        rollupOptions: {
            external: [
                /^node:.*/,
                'fs',
                'path',
                'vite'
            ],
        },
    },
    plugins: [
        dts({
            outDir: 'dist',
            insertTypesEntry: true,
        }),
    ],
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

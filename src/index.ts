import { promises as fs } from 'fs';
import { resolve } from 'path';
import { compile } from '@/compiler';
import type { Plugin, ViteDevServer } from 'vite';
import logger from '@/logger';

/**
 * Configuration options for the Aurynx Vite plugin.
 */
interface AurynxPluginOptions {
    /**
     * The base PHP namespace for your view components.
     * @default 'App\\View\\Components\\'
     */
    componentNamespace?: string;
    /**
     * Path to your source templates, relative to the project root.
     * @default 'resources/views'
     */
    viewsPath?: string;
    /**
     * Path where the compiled PHP templates should be stored.
     * @default 'cache/views'
     */
    cachePath?: string;
    /**
     * The file extension for your Aurynx templates.
     * @default '.anx.php'
     */
    viewExtension?: string;
    /**
     * Whether to perform an initial full compilation on startup / build.
     * @default true
     */
    buildOnStart?: boolean;
}

const projectRoot = resolve(process.cwd());

/**
 * Creates a new instance of the Aurynx Vite plugin.
 * This is the main entry point for integrating with your `vite.config.ts`.
 *
 * @param options - Optional configuration for the plugin.
 */
export default function aurynx(options: AurynxPluginOptions = {}): Plugin {
    // Merge user-provided options with sensible defaults.
    const config = {
        componentNamespace: 'App\\View\\Components\\',
        viewsPath: 'resources/views',
        cachePath: 'cache/views',
        viewExtension: '.anx.php',
        buildOnStart: true,
        ...options,
    };

    // Resolve all paths to be absolute for reliability.
    const paths = {
        views: resolve(projectRoot, config.viewsPath),
        cache: resolve(projectRoot, config.cachePath),
    };

    // Create a compiler instance pre-configured with the component namespace.
    const boundCompile = (template: string) => compile(template, config.componentNamespace);

    /**
     * Reads a source view, compiles it, and writes the result to the cache directory.
     */
    const compileView = async (file: string): Promise<void> => {
        try {
            const template = await fs.readFile(file, 'utf-8');
            const compiled = boundCompile(template);

            const relativePath = file.substring(paths.views.length + 1).replace(config.viewExtension, '.php');
            const outputFile = resolve(paths.cache, relativePath);
            const outputDir = resolve(outputFile, '..');

            await fs.mkdir(outputDir, { recursive: true });
            await fs.writeFile(outputFile, compiled);

            logger.log('✅ Compiled:', relativePath);
        } catch (error) {
            logger.error('❌ Error compiling view', file, error);
        }
    };

    /**
     * Recursively walk the views directory and compile all matching templates.
     */
    const initialBuild = async (): Promise<void> => {
        try {
            // Ensure the views directory exists.
            await fs.access(paths.views).catch(() => { throw new Error('Views path does not exist'); });

            const walk = async (dir: string): Promise<string[]> => {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                const files = await Promise.all(entries.map(async (entry) => {
                    const full = resolve(dir, entry.name);
                    if (entry.isDirectory()) return walk(full);
                    return full;
                }));
                return files.flat();
            };

            logger.log('🔁 Performing initial compilation...');
            const all = await walk(paths.views);
            const targets = all.filter(f => f.endsWith(config.viewExtension));

            if (!targets.length) {
                logger.info('ℹ️ No view templates found for initial compilation.');
                return;
            }

            await Promise.all(targets.map(f => compileView(f)));
            logger.log(`✅ Initial compilation finished (${targets.length} files).`);
        } catch (err) {
            logger.warn('⚠️ Skipping initial compilation:', err instanceof Error ? err.message : err);
        }
    };

    return {
        name: 'vite-plugin-aurynx',

        // Run initial build only during the production (Rollup) build phase.
        buildStart: async () => {
            if (process.env.NODE_ENV !== 'development' && config.buildOnStart) {
                await initialBuild();
            }
        },

        // This hook wires into the dev server and its file watcher.
        // Await initial build so the cache is ready before the first request.
        async configureServer({ watcher }: ViteDevServer) {
            if (config.buildOnStart) {
                await initialBuild();
                logger.log('✅ Plugin ready');
            }

            const listener = (file: string): void => {
                if (file.startsWith(paths.views) && file.endsWith(config.viewExtension)) {
                    compileView(file);
                }
            };

            watcher.on('add', listener);
            watcher.on('change', listener);
        },
    };
}

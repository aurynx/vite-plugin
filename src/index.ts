import { promises as fs } from 'fs';
import { resolve } from 'path';
import { compile } from '@/compiler';
import type { Plugin, ViteDevServer } from 'vite';

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

            console.log(`✅ [Aurynx] Compiled: ${relativePath}`);
        } catch (error) {
            console.error(`❌ [Aurynx] Error compiling view ${file}:`, error);
        }
    };

    return {
        name: 'vite-plugin-aurynx',

        // This hook gives us access to the Vite development server and its file watcher.
        configureServer({ watcher }: ViteDevServer) {
            // A single handler for file changes to keep the code DRY.
            const listener = (file: string): void => {
                if (file.startsWith(paths.views) && file.endsWith(config.viewExtension)) {
                    compileView(file);
                }
            };

            // We listen for both 'add' (new files) and 'change' (modified files) events.
            watcher.on('add', listener);
            watcher.on('change', listener);
        },
    };
}

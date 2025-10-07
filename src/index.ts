import { promises as fs } from 'fs';
import { resolve } from 'path';
import { compile } from '@/compiler';
import type { Plugin } from 'vite';
import logger from '@/logger';

/**
 * Configuration options for the Aurynx Vite plugin.
 *
 * These options control where templates are read from, where compiled PHP is
 * written, and how component names are resolved. Defaults are explicit so the
 * plugin behaves predictably without a user-provided config.
 */
interface AurynxPluginOptions {
    /**
     * Base PHP namespace used to resolve component tags into classes.
     * Example: <x-button> becomes App\\View\\Components\\Button when this
     * value is 'App\\View\\Components\\'. Adjust to match your app layout.
     */
    componentNamespace?: string;
    /**
     * Root directory (relative to project root) containing Aurynx templates.
     * The plugin watches this path and walks it during initial compilation.
     */
    viewsPath?: string;
    /**
     * Destination directory for compiled PHP files. Treated as a build artifact
     * (do not commit). Using a dedicated cache directory avoids overwriting
     * source templates.
     */
    cachePath?: string;
    /**
     * File extension used to recognize Aurynx templates. Keep this if you use
     * a different convention.
     */
    viewExtension?: string;
    /**
     * Whether to perform a full compilation at server start. Enabling this
     * surfaces template errors early but can slow startup for large projects.
     */
    buildOnStart?: boolean;
}

const projectRoot = resolve(process.cwd());

/**
 * Main plugin factory: produces a Vite plugin object.
 *
 * Behaviour summary:
 * - Development: optionally run an initial compilation and watch for changes.
 * - Production/build: run a single compilation before bundling to produce a
 *   deterministic cache.
 *
 * Design notes: initial full builds are explicit while runtime updates are
 * incremental; this keeps runtime overhead low and provides fast feedback.
 */
export default function aurynx(options: AurynxPluginOptions = {}): Plugin {
    const config = {
        componentNamespace: 'App\\View\\Components\\',
        viewsPath: 'resources/views',
        cachePath: 'cache/views',
        viewExtension: '.anx.php',
        buildOnStart: true,
        ...options,
    };

    // Resolve absolute paths right away to avoid surprises if the process CWD
    // changes while Vite is running (keeps subsequent path comparisons stable).
    const paths = {
        views: resolve(projectRoot, config.viewsPath),
        cache: resolve(projectRoot, config.cachePath),
    };

    // Bind the configured namespace into the compiler function so callers
    // don't need to pass it repeatedly; this keeps call sites concise.
    const boundCompile = (template: string) => compile(template, config.componentNamespace);

    /**
     * Compile a single template and write the resulting PHP into the cache
     * directory, preserving the relative structure from the views root.
     *
     * Side effects:
     * - Overwrites existing compiled files (compiled output is a build artifact).
     * - Creates directories as needed.
     *
     * Errors are logged rather than thrown so the dev server remains running.
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
            // Log compilation errors and continue so the dev server stays available.
            logger.error('❌ Error compiling view', file, error);
        }
    };

    /**
     * Perform an initial walk of the views directory and compile matching files.
     *
     * Implementation notes and trade-offs:
     * - Uses a simple recursive readdir walk and collects files before filtering
     *   by extension. This keeps traversal logic straightforward.
     * - All files are compiled concurrently via Promise.all; if I/O pressure
     *   becomes an issue this could be throttled or batched.
     * - If the views path is missing, the build is skipped with a warning.
     */
    const initialBuild = async (): Promise<void> => {
        try {
            // If the views folder doesn't exist, skip the build early.
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
                // Informative: no templates were discovered under the views path.
                logger.info('ℹ️ No templates found — nothing to compile.');
            }

            // Compile matching templates concurrently. If this becomes a hotspot
            // consider processing files in batches to reduce I/O pressure.
            await Promise.all(targets.map(f => compileView(f)));
            logger.log(`✅ Initial compilation finished (${targets.length} files).`);
        } catch (err) {
            // Non-fatal: emit a warning and continue. The message should contain
            // enough information (missing path, permission error) to investigate.
            logger.warn('⚠️ Skipping initial compilation:', err instanceof Error ? err.message : err);
        }
    };

    return {
        name: 'vite-plugin-aurynx',

        // In production builds ensure a deterministic cached output before bundling.
        async buildStart() {
            if (process.env.NODE_ENV !== 'development' && config.buildOnStart) {
                await initialBuild();
            }
        },

        // In development: optionally run an initial build and then watch for changes
        // in the configured views directory to recompile incrementally.
        async configureServer({ watcher }) {
            if (config.buildOnStart) {
                await initialBuild();
                logger.log('✅ Plugin ready');
            }

            // Only respond to file events that originate from the views path and
            // match the configured template extension to avoid unrelated rebuilds.
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

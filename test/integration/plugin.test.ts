import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import aurynx from '@/index';
import { promises as fs } from 'fs';
import { resolve } from 'path';

// Integration test paths — we create real directories to verify the plugin works end-to-end
const root = process.cwd();
const viewsDir = resolve(root, 'resources/views');
const cacheDir = resolve(root, 'cache/views');
const resourcesRoot = resolve(root, 'resources');
const cacheRoot = resolve(root, 'cache');

const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

const writeTemplate = async (rel: string, content: string) => {
  const full = resolve(viewsDir, rel);
  await fs.mkdir(resolve(full, '..'), { recursive: true });
  await fs.writeFile(full, content, 'utf8');
};

describe('plugin initial build', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // Start fresh — clean up from previous runs or interrupted tests
    // Clean full roots first (covers aborted runs or layout changes)
    await fs.rm(cacheRoot, { recursive: true, force: true });
    await fs.rm(resourcesRoot, { recursive: true, force: true });
    await ensureDir(viewsDir);
    await writeTemplate('sample.anx.php', '<div>{{ $value }}</div>');

    // Spy on console.log to verify compilation messages
    logSpy = vi.spyOn(console, 'log');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(cacheRoot, { recursive: true, force: true });
    await fs.rm(resourcesRoot, { recursive: true, force: true });
  });

  it('compiles template on configureServer initial build', async () => {
    const plugin = aurynx();
    await (plugin as any).configureServer({ watcher: { on: () => {} } });

    const compiledFile = resolve(cacheDir, 'sample.php');
    const exists = await fs.access(compiledFile).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    const hasCompiledLog = logSpy.mock.calls.some((call: any[]) => call.some((arg: any) => typeof arg === 'string' && arg.includes('✅ Compiled:')));
    expect(hasCompiledLog).toBe(true);
  });
});

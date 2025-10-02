import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import aurynx from '@/index';
import { promises as fs } from 'fs';
import { resolve } from 'path';

const root = process.cwd();
const viewsDir = resolve(root, 'resources/views');
const cacheDir = resolve(root, 'cache/views');

const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

const writeTemplate = async (rel: string, content: string) => {
  const full = resolve(viewsDir, rel);
  await fs.mkdir(resolve(full, '..'), { recursive: true });
  await fs.writeFile(full, content, 'utf8');
};

describe('plugin initial build', () => {
  let logSpy: any;

  beforeEach(async () => {
    await fs.rm(viewsDir, { recursive: true, force: true });
    await fs.rm(cacheDir, { recursive: true, force: true });
    await ensureDir(viewsDir);
    await writeTemplate('sample.anx.php', '<div>{{ $value }}</div>');
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(cacheDir, { recursive: true, force: true });
    await fs.rm(viewsDir, { recursive: true, force: true });
  });

  it('compiles template on configureServer initial build', async () => {
    const plugin = aurynx();
    // minimal watcher mock
    await (plugin as any).configureServer({ watcher: { on: () => {} } });

    // Expect compiled file exists
    const compiledFile = resolve(cacheDir, 'sample.php');
    const exists = await fs.access(compiledFile).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Expect at least one compiled log line with emoji
    const hasCompiledLog = logSpy.mock.calls.some((call: any[]) => call.some((arg: any) => typeof arg === 'string' && arg.includes('✅ Compiled:')));
    expect(hasCompiledLog).toBe(true);
  });
});

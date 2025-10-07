import { readFileSync } from 'fs';
import { join } from 'path';

const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

/**
 * Loads a test fixture pair: the source template and its expected compiled output.
 * Saves us from embedding giant PHP strings directly in test files.
 */
export const readFixture = (name: string): { template: string, expected: string } => {
    const template = readFileSync(join(FIXTURES_DIR, 'templates', `${name}.anx.php`), 'utf-8');
    const expected = readFileSync(join(FIXTURES_DIR, 'expected', `${name}.php`), 'utf-8');

    return { template, expected };
};

import { readFileSync } from 'fs';
import { join } from 'path';

const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

export const readFixture = (name: string): { template: string, expected: string } => {
    const template = readFileSync(join(FIXTURES_DIR, 'templates', `${name}.anx.php`), 'utf-8');
    const expected = readFileSync(join(FIXTURES_DIR, 'expected', `${name}.php`), 'utf-8');

    return { template, expected };
};

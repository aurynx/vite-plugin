import { readFileSync } from 'fs';
import { join } from 'path';

const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

export const readTemplate = (name: string): string => {
    return readFileSync(join(FIXTURES_DIR, 'templates', `${name}.anx.php`), 'utf-8');
};

export const readExpected = (name: string): string => {
    return readFileSync(join(FIXTURES_DIR, 'expected', `${name}.php`), 'utf-8');
};

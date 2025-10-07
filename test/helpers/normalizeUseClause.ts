/**
 * Test helper that sorts variables in `use (...)` clauses for stable comparisons.
 * Closure variable order can vary, so we normalize before asserting equality.
 */
export const normalizeUseClause = (
    str: string,
    opts?: { stripWhitespace?: boolean; global?: boolean }
): string => {
    const global = opts?.global ?? true;
    const stripWhitespace = opts?.stripWhitespace ?? false;

    const regex: RegExp = global ? /use \((.*?)\)/g : /use \((.*?)\)/;

    let normalized = str.replace(regex, (_match: string, p1: string) => {
        const vars = p1
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
            .sort()
            .join(', ');

        return `use (${vars})`;
    });

    if (stripWhitespace) {
        normalized = normalized.replace(/\s+/g, '');
    }

    return normalized;
};

import { phpSyntax } from './syntax';

/**
 * PhpBuilder — a small fluent API for constructing PHP source.
 *
 * The builder delegates to phpSyntax primitives to ensure consistent output
 * while providing a slightly higher-level interface for common patterns
 * (component calls, anonymous functions, short echo blocks, etc.).
 */
export class PhpBuilder {
    #lines: string[] = [];
    #indentLevel: number = 0;
    // eslint-disable-next-line no-unused-private-class-members
    // @ts-ignore - private config stored for future use; intentionally unused for now
    #config: PhpBuilderConfig;

    constructor(config?: Partial<PhpBuilderConfig>) {
        this.#config = {
            indentSpaces: 4,
            lineEnding: '\n',
            ...config,
        };
    }

    /**
     * Adds the opening <?php tag.
     */
    openTag(): this {
        this.#lines.push(phpSyntax.tags.open);
        return this;
    }

    /**
     * Adds declare(strict_types=1).
     */
    strictTypes(): this {
        this.#lines.push(phpSyntax.declare.strictTypes);
        return this;
    }

    /**
     * Adds a return statement with an arrow function: return static fn(): type => body;
     */
    returnArrowFunction(params: string, returnType: string, body: string): this {
        this.#lines.push(phpSyntax.return.arrowFunction(params, returnType, body));
        return this;
    }

    /**
     * Creates a static arrow function without return statement: static fn(): type => body
     */
    staticArrowFunction(params: string, returnType: string, body: string): string {
        return phpSyntax.functions.arrow.static(params, returnType, body);
    }

    /**
     * Creates a static regular function: static function(): type { ... }
     */
    staticFunction(params: string, returnType: string, body: string): string {
        return phpSyntax.functions.regular.static('', params, returnType, body);
    }

    /**
     * Generates a function call with named arguments (PHP 8.0+).
     * Returns a multi-line representation when called with multiple args.
     */
    functionCall(name: string, args: Record<string, string>): string {
        const namedArgs = Object.entries(args)
            .map(([key, value]) => phpSyntax.namedArgs.format(key, value))
            .join(',\n  ');

        return `${name}(\n  ${namedArgs},\n)`;
    }

    /**
     * Builds a component() call with named arguments — the standard way to invoke components.
     */
    componentCall(componentClass: string, props?: string, slot?: string): string {
        const args: Record<string, string> = {
            componentClass: `${componentClass}${phpSyntax.operators.classConstant}`,
        };

        if (props) {
            args.props = props;
        }

        if (slot) {
            args.slot = slot;
        }

        return this.functionCall('component', args);
    }

    /**
     * Creates an anonymous function: function() { ... }
     */
    anonymousFunction(params: string, returnType: string, body: string): string {
        return phpSyntax.functions.regular.anonymous(params, returnType, body);
    }

    /**
     * Wraps content in full PHP tags: <?php ... ?>
     */
    phpBlock(content: string): string {
        return `${phpSyntax.tags.open} ${content} ${phpSyntax.tags.close}`;
    }

    /**
     * Creates a short echo tag: <?= ... ?>
     */
    shortEcho(content: string): string {
        return `${phpSyntax.tags.shortEcho}\n${content}\n${phpSyntax.tags.close}`;
    }

    /**
     * Creates a PHP statement block: <?php statement; ?>
     */
    phpStatement(statement: string): string {
        return `${phpSyntax.tags.open} ${statement}; ${phpSyntax.tags.close}`;
    }

    /**
     * Creates a variable assignment in a PHP block: <?php $var = value; ?>
     */
    variableAssignment(varName: string, value: string): string {
        return this.phpStatement(`${varName} = ${value}`);
    }

    /**
     * Adds a blank line for spacing.
     */
    emptyLine(): this {
        this.#lines.push('');
        return this;
    }

    /**
     * Adds a raw line of code.
     */
    line(content: string): this {
        this.#lines.push(content);
        return this;
    }

    /**
     * Increases indentation level — future lines will be indented further.
     */
    indent(): this {
        this.#indentLevel++;
        return this;
    }

    /**
     * Decreases indentation level.
     */
    outdent(): this {
        if (this.#indentLevel > 0) {
            this.#indentLevel--;
        }
        return this;
    }

    /**
     * Joins all lines into the final PHP code string.
     */
    build(): string {
        return this.#lines.join(phpSyntax.formatting.newline);
    }

    /**
     * Clears the builder so you can start fresh.
     */
    reset(): this {
        this.#lines = [];
        this.#indentLevel = 0;
        return this;
    }
}

export interface PhpBuilderConfig {
    indentSpaces: number;
    lineEnding: string;
}

/**
 * Factory function — creates a new PhpBuilder with your preferred config.
 */
export function createPhpBuilder(config?: Partial<PhpBuilderConfig>): PhpBuilder {
    return new PhpBuilder(config);
}

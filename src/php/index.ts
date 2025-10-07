/**
 * PHP code generation entrypoint.
 *
 * Exposes a small, layered system for producing PHP source:
 * - Syntax: primitive string patterns for PHP constructs.
 * - Builder: a minimal fluent API that composes those primitives.
 * - Presets: opinionated configuration for target PHP versions.
 *
 * Keeping this separation makes it easy to swap formatting or target features
 * without touching the higher-level builder/consumers.
 */

export { phpSyntax } from './syntax';
export { PhpBuilder, createPhpBuilder, type PhpBuilderConfig } from './builder';
export { php84Preset, defaultPreset, type PhpPreset } from './presets';

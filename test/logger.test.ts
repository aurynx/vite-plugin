import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/logger';

// Common prefix we expect in all logger outputs.
const PREFIX = '[Aurynx Vite Plugin]';

// Helper to create a spy and restore automatically.
const spy = <K extends keyof Console>(method: K) => {
  const s = vi.spyOn(console, method as any).mockImplementation(() => {});
  return s;
};

describe('logger', () => {
  let logSpy: ReturnType<typeof spy>;
  let infoSpy: ReturnType<typeof spy>;
  let warnSpy: ReturnType<typeof spy>;
  let errorSpy: ReturnType<typeof spy>;
  let timeSpy: ReturnType<typeof spy>;
  let timeEndSpy: ReturnType<typeof spy>;
  let assertSpy: ReturnType<typeof spy>;

  beforeEach(() => {
    logSpy = spy('log');
    infoSpy = spy('info');
    warnSpy = spy('warn');
    errorSpy = spy('error');
    timeSpy = spy('time');
    timeEndSpy = spy('timeEnd');
    assertSpy = spy('assert');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes log/info/warn/error output', () => {
    logger.log('hello');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(logSpy).toHaveBeenCalledWith(PREFIX, 'hello');
    expect(infoSpy).toHaveBeenCalledWith(PREFIX, 'info');
    expect(warnSpy).toHaveBeenCalledWith(PREFIX, 'warn');
    expect(errorSpy).toHaveBeenCalledWith(PREFIX, 'error');
  });

  it('adds prefix to time/timeEnd labels', () => {
    logger.time('phase');
    logger.timeEnd('phase');

    expect(timeSpy).toHaveBeenCalledWith(`${PREFIX} phase`);
    expect(timeEndSpy).toHaveBeenCalledWith(`${PREFIX} phase`);
  });

  it('assert passes prefix when condition fails', () => {
    logger.assert(false, 'failure');

    // First argument is condition (false), then the prefix and additional data.
    expect(assertSpy.mock.calls[0][0]).toBe(false);
    expect(assertSpy.mock.calls[0][1]).toBe(PREFIX);
    expect(assertSpy.mock.calls[0][2]).toBe('failure');
  });

  it('assert does not emit extra args when condition true', () => {
    logger.assert(true, 'should-not-log');
    // With true condition, original console.assert(true) still called once.
    expect(assertSpy).toHaveBeenCalledTimes(1);
    expect(assertSpy.mock.calls[0][0]).toBe(true);
    // Should not include prefix for successful asserts according to implementation.
    expect(assertSpy.mock.calls[0].length).toBe(1);
  });
});

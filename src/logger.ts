/* Simple logger that prefixes all console output with a fixed tag. */

export interface AurynxLogger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  trace: (...args: unknown[]) => void;
  group: (...label: unknown[]) => void;
  groupCollapsed: (...label: unknown[]) => void;
  groupEnd: () => void;
  time: (label?: string) => void;
  timeEnd: (label?: string) => void;
  timeLog: (label?: string, ...data: unknown[]) => void;
  count: (label?: string) => void;
  countReset: (label?: string) => void;
  table: (data: unknown, columns?: string[]) => void;
  dir: (item: unknown, options?: unknown) => void;
  dirxml: (...data: unknown[]) => void;
  assert: (condition?: boolean, ...data: unknown[]) => void;
  clear: () => void;
  profile: (label?: string) => void;
  profileEnd: (label?: string) => void;
  timeStamp: (label?: string) => void;
}

const makeLabel = (prefix: string, label?: string) => label ? `${prefix} ${label}` : prefix;

const createLogger = (prefix: string): AurynxLogger => {
  const base = prefix;

  const pass = (method: keyof Console) => (...args: unknown[]) => {
    const fn = (console as any)[method];
    if (typeof fn === 'function') fn(base, ...args);
  };

  const labelled = (method: keyof Console) => (label?: string) => {
    const fn = (console as any)[method];
    if (typeof fn === 'function') fn(makeLabel(base, label));
  };

  const labelledData = (method: keyof Console) => (label?: string, ...data: unknown[]) => {
    const fn = (console as any)[method];
    if (typeof fn === 'function') fn(makeLabel(base, label), ...data);
  };

  return {
    log: pass('log'),
    info: pass('info'),
    warn: pass('warn'),
    error: pass('error'),
    debug: pass('debug'),
    trace: pass('trace'),
    group: pass('group'),
    groupCollapsed: pass('groupCollapsed'),
    groupEnd: () => { if (typeof console.groupEnd === 'function') console.groupEnd(); },
    time: labelled('time'),
    timeEnd: labelled('timeEnd'),
    timeLog: labelledData('timeLog'),
    count: labelled('count'),
    countReset: labelled('countReset'),
    table: (data: unknown, columns?: string[]) => { console.log(base); if (typeof console.table === 'function') (console as any).table(data, columns); },
    dir: (item: unknown, options?: unknown) => { console.log(base); if (typeof console.dir === 'function') console.dir(item, options as any); },
    dirxml: (...data: unknown[]) => { console.log(base); if (typeof (console as any).dirxml === 'function') (console as any).dirxml(...data); else console.log(...data); },
    assert: (condition?: boolean, ...data: unknown[]) => { if (!condition) { if (typeof console.assert === 'function') console.assert(condition, base, ...data); else console.error(base, 'Assertion failed', ...data); } else { if (typeof console.assert === 'function') console.assert(condition); } },
    clear: () => { if (typeof console.clear === 'function') console.clear(); },
    profile: labelled('profile'),
    profileEnd: labelled('profileEnd'),
    timeStamp: labelled('timeStamp'),
  };
};

export const logger = createLogger('[Aurynx Vite Plugin]');
export default logger;

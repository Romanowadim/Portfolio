// Per-file async mutex to prevent race conditions on concurrent JSON read-modify-write
const locks = new Map<string, Promise<void>>();

export function withFileLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(file) ?? Promise.resolve();
  let resolve: () => void;
  const next = new Promise<void>((r) => { resolve = r; });
  locks.set(file, next);
  return prev.then(fn).finally(() => resolve!());
}

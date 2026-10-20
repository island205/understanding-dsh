// Minimal type declarations for DSH's Cordis Context.
// DSH injects the real Context at runtime; this file only exists for compilation.

declare module 'cordis' {
  export interface Logger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    debug(message: string): void;
  }

  export class Context {
    root: Context;
    [key: string]: any;
    logger(name: string): Logger;
    effect(callback: () => void | (() => void)): void;
    on(name: string, listener: (...args: any[]) => any): () => void;
  }
}

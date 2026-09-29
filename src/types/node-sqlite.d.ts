/**
 * Minimal ambient types for `node:sqlite`.
 *
 * The project pins @types/node 20, which predates this built-in. Upgrading
 * @types/node would ripple through the whole app, so we declare only the
 * surface actually used here. Drop this file if @types/node is ever raised
 * to 22+.
 */
declare module 'node:sqlite' {
  export interface StatementSync {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  }

  export class DatabaseSync {
    constructor(location: string);
    exec(sql: string): void;
    close(): void;
    prepare(sql: string): StatementSync;
  }
}

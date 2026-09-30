/**
 * Test-only ESM loader.
 *
 * The app's source files use two things Node cannot resolve on its own:
 *
 *   1. the `server-only` package, which is a build-time guard that Next.js
 *      swaps for an empty module. It only needs to EXIST for the import to
 *      resolve, so this resolves it to a harmless empty module.
 *   2. the `@/` path alias declared in tsconfig.json.
 *
 * Both are resolved here rather than in the test so the application source
 * stays completely untouched.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

/** Stands in for the `server-only` package. */
const SERVER_ONLY_STUB = 'data:text/javascript,export default {};\n';

/**
 * Stands in for `next/headers`.
 *
 * `currentUser()` reads the session cookie through it, but that path is
 * request-scoped and cannot run outside a real Next.js request. The test
 * exercises the session store itself (`createSession` / `userForToken`), so an
 * empty `cookies()` is enough — and it keeps the data layer under test
 * independent of the web framework.
 */
const NEXT_HEADERS_STUB = [
  'data:text/javascript,',
  'export const cookies = () => ({ get: () => undefined, set: () => {}, delete: () => {} });',
  'export const headers = () => new Map();',
  'export const draftMode = () => ({ isEnabled: false, enable: () => {}, disable: () => {} });',
].join('');

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return { url: SERVER_ONLY_STUB, shortCircuit: true, format: 'module' };
  }

  if (specifier === 'next/headers') {
    return { url: NEXT_HEADERS_STUB, shortCircuit: true, format: 'module' };
  }

  // `guards.ts` imports `redirect` from here. It throws a control-flow error
  // in a real request; the stub throws a plain Error, which is enough for the
  // test to assert that an unauthenticated read is refused.
  if (specifier === 'next/navigation') {
    return {
      url:
        'data:text/javascript,' +
        'export const redirect = (u) => { throw new Error("NEXT_REDIRECT:" + u); };' +
        'export const notFound = () => { throw new Error("NEXT_NOT_FOUND"); };' +
        'export const permanentRedirect = redirect;',
      shortCircuit: true,
      format: 'module',
    };
  }

  // The app's modules import each other without file extensions (`./config`),
  // which is legal for the bundler but not for Node's ESM resolver. Add the
  // extension back for any extensionless relative or aliased path.
  if (specifier.startsWith('@/') || (specifier.startsWith('./') && !/\.[cm]?[jt]sx?$/.test(specifier))) {
    const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : SRC;
    const base = specifier.startsWith('@/')
      ? path.join(SRC, specifier.slice(2))
      : path.resolve(path.dirname(parentPath), specifier);
    const target = /\.[cm]?[jt]sx?$/.test(base) ? base : `${base}.ts`;
    return { url: pathToFileURL(target).href, shortCircuit: true, format: 'module-typescript' };
  }

  return nextResolve(specifier, context);
}



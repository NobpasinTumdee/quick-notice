/**
 * Lets `node --test` load the app's TypeScript sources directly.
 *
 * Node 24 strips TS types on its own, but its ESM resolver will not guess a
 * file extension the way a bundler does — and the app's imports are written
 * bundler-style (`./themes`, not `./themes.ts`). This hook retries a failed
 * relative resolve with the extensions Vite would have tried.
 */
const EXTENSIONS = ['.ts', '.tsx', '/index.ts']

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (error) {
    if (!specifier.startsWith('.')) throw error
    for (const extension of EXTENSIONS) {
      try {
        return await next(specifier + extension, context)
      } catch {
        /* try the next candidate */
      }
    }
    throw error
  }
}

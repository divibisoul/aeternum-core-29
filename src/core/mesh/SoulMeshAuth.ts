import type { MeshAuthContext } from './types';

/**
 * Verifies a peer token without ever persisting the shared secret in IndexedDB.
 * The secret must be supplied by a trusted runtime boundary; Vite public env is not suitable.
 */
export function verifySoulMeshAuth(providedToken: string | undefined, context: MeshAuthContext): boolean {
  if (context.disabled === true) return true;
  if (!providedToken || !context.token) return false;
  if (providedToken.length !== context.token.length) return false;

  let difference = 0;
  for (let index = 0; index < providedToken.length; index += 1) {
    difference |= providedToken.charCodeAt(index) ^ context.token.charCodeAt(index);
  }
  return difference === 0;
}

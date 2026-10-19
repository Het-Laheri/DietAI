// Attaches the signed-in user's Firebase ID token to every same-origin /api request.
// Every API route verifies this token server-side (see api/_lib/security.ts).
import { auth } from './firebase';

let installed = false;

function isOwnApiRequest(input: RequestInfo | URL): boolean {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

async function getCurrentIdTokenWithHydrationWait(timeoutMs = 3000): Promise<string | null> {
  try {
    if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
      await Promise.race([
        (auth as any).authStateReady(),
        new Promise((r) => setTimeout(r, timeoutMs)),
      ]);
    }
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = await getCurrentIdTokenWithHydrationWait();
  const headers = new Headers(
    init?.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined)
  );
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}

export function installApiAuth() {
  if (installed || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  installed = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!isOwnApiRequest(input)) {
      return originalFetch(input, init);
    }
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) {
      const token = await getCurrentIdTokenWithHydrationWait();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return originalFetch(input, { ...init, headers });
  };
}


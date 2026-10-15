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

export function installApiAuth() {
  if (installed || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  installed = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!isOwnApiRequest(input) || !auth.currentUser) {
      return originalFetch(input, init);
    }
    let token: string | null = null;
    try {
      token = await auth.currentUser.getIdToken();
    } catch {
      token = null;
    }
    if (!token) return originalFetch(input, init);

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    return originalFetch(input, { ...init, headers });
  };
}

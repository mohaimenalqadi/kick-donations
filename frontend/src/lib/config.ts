/**
 * Runtime endpoints.
 *
 * - REST calls go to the same origin (`/api/...`) and are proxied to the
 *   backend by a Next.js rewrite, so the session cookie is first-party.
 * - The socket and file uploads connect to the backend directly
 *   (WebSockets and large bodies cannot go through the proxy).
 */
export const DIRECT_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
export const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || DIRECT_API_URL).replace(/\/+$/, '');

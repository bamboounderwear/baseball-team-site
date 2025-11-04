export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  setSecurityHeaders(headers);
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function text(data: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  setSecurityHeaders(headers);
  return new Response(data, { ...init, headers });
}

export function css(data: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'text/css; charset=utf-8');
  setSecurityHeaders(headers);
  return new Response(data, { ...init, headers });
}

export function html(data: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'text/html; charset=utf-8');
  setSecurityHeaders(headers);
  return new Response(data, { ...init, headers });
}

export function setCors(headers: Headers): void {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
}

export function setSecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer-when-downgrade');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' https://placehold.co data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'");
}

export function error(status: number, message: string, extra?: Record<string, unknown>): Response {
  return json({ error: message, ...extra }, { status });
}

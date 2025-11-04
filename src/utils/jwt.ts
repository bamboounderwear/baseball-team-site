/**
 * Minimal JWT (HS256) utilities using Web Crypto.
 * Avoids external deps like `jose` to keep bundle lean.
 */
export type JwtPayload = Record<string, unknown> & { exp?: number, iat?: number };

function base64urlEncode(data: ArrayBuffer): string {
  const bytes = new Uint8Array(data);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecode(input: string): ArrayBuffer {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = input.length % 4;
  if (pad) input += '='.repeat(4 - pad);
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function signJWT(payload: JwtPayload, secret: string, expiresInSec = 60*60): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSec;
  const body = { ...payload, iat, exp };

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  const headerB64 = base64urlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(enc.encode(JSON.stringify(body)));
  const data = `${headerB64}.${payloadB64}`;
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigB64 = base64urlEncode(sig);
  return `${data}.${sigB64}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JwtPayload | null> {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const valid = await crypto.subtle.verify('HMAC', key, enc.encode(`${h}.${p}`), base64urlDecode(s));
  if (!valid) return null;
  const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(p))) as JwtPayload;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) return null;
  return payload;
}

import { getDb } from './db/client';
import { designTokens, settings, players, news, games, venues, tickets, products, subscribers, admins, orders, orderItems } from './db/schema';
import { json, error, css, html } from './utils/http';
import { signJWT, verifyJWT } from './utils/jwt';
import { and, eq, desc, like, sql } from 'drizzle-orm';
import type { Env } from './types';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      const res = new Response(null, { status: 204 });
      res.headers.set('Access-Control-Allow-Origin', '*');
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      return res;
    }

    // API routes
    if (url.pathname.startsWith('/api/')) {
      try {
        return await this.handleApi(request, env, ctx);
      } catch (e) {
        console.error(e);
        return error(500, 'Internal Server Error');
      }
    }

    // Theme CSS (loaded after Tailwind)
    if (url.pathname === '/theme.css' || url.pathname === '/api/theme.css') {
      return this.themeCss(env);
    }

    // Fallback to static assets (Svelte app)
    const assetRes = await env.ASSETS.fetch(request);
    // Log a simple page-view event (non-blocking)
    try {
      // @ts-ignore - AnalyticsEngineDataset type
      env.ANALYTICS.writeDataPoint({
        indexes: [ 'pageview' ],
        blobs: [ url.pathname ],
        doubles: [ Date.now() ]
      });
    } catch {}
    return assetRes;
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Release expired ticket reservations
    const db = getDb(env.DB);
    const now = Date.now();
    await db.run(sql`UPDATE tickets SET status = 'available', reserved_until = NULL WHERE status = 'reserved' AND reserved_until IS NOT NULL AND reserved_until < ${now}`);
  },

  async themeCss(env: Env): Promise<Response> {
    const db = getDb(env.DB);
    const rows = await db.select().from(designTokens);
    const tokens = Object.fromEntries(rows.map(r => [r.key, r.value]));
    const cssVars = `:root{
      --font-family: ${tokens['font_family'] ?? "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"};
      --container-max: ${tokens['container_max'] ?? "1200px"};
      --line-height: ${tokens['line_height'] ?? "1.6"};
      --base-gap: ${tokens['base_gap'] ?? "1rem"};
    }
    html,body{background:#fff;color:#000;font-family:var(--font-family);line-height:var(--line-height);}
    .container{max-width:var(--container-max);margin-inline:auto;padding-inline:1rem;width:100%;}
    .grid{display:grid;gap:var(--base-gap);}
    img{display:block;max-width:100%;height:auto;}
    a{color:inherit;text-decoration:underline;}
    button{border:1px solid #000;background:#000;color:#fff;padding:0.5rem 1rem;}
    input,select,textarea{border:1px solid #000;padding:0.5rem;width:100%;}
    table{width:100%;border-collapse:collapse;}
    th,td{border:1px solid #000;padding:0.5rem;text-align:left;}
    `;
    return css(cssVars);
  },

  async handleApi(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const db = getDb(env.DB);

    // Helper: session cookie for cart
    const sessionId = await getOrSetSessionId(request, env);

    // Public endpoints
    if (request.method === 'GET' && url.pathname === '/api/home') {
      const hero = await getSetting(db, 'hero');
      const upcomingGames = await db.select().from(games).orderBy(desc(games.date)).limit(6);
      const recentNews = await db.select().from(news).orderBy(desc(news.publishedAt)).limit(6);
      return json({ hero, upcomingGames, recentNews });
    }

    if (request.method === 'POST' && url.pathname === '/api/newsletter') {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || '').trim().toLowerCase();
      const name = String(body.name || '').trim();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return error(400, 'Invalid email');
      await db.insert(subscribers).values({ email, name, createdAt: Date.now() }).onConflictDoNothing();
      return json({ ok: true });
    }

    if (request.method === 'GET' && url.pathname === '/api/news') {
      const list = await db.select().from(news).orderBy(desc(news.publishedAt)).limit(24);
      return json({ list });
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/news/')) {
      const slug = url.pathname.split('/').pop() as string;
      const row = await db.select().from(news).where(eq(news.slug, slug)).get();
      if (!row) return error(404, 'Not found');
      return json(row);
    }

    if (request.method === 'GET' && url.pathname === '/api/games') {
      const list = await db.select().from(games).orderBy(desc(games.date)).limit(50);
      return json({ list });
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/games/')) {
      const slug = url.pathname.split('/').pop() as string;
      const row = await db.select().from(games).where(eq(games.slug, slug)).get();
      if (!row) return error(404, 'Not found');
      // Provide ticket sections summary
      const sections = await db.all(sql`SELECT section, COUNT(*) AS total, SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available FROM tickets WHERE game_id = ${row.id} GROUP BY section`);
      return json({ ...row, sections });
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/tickets')) {
      // /api/tickets?gameId=1&section=A
      const gameId = Number(new URL(request.url).searchParams.get('gameId') || '0');
      const section = String(new URL(request.url).searchParams.get('section') || '');
      const rows = await db.all(sql`SELECT row, seat, price, status FROM tickets WHERE game_id = ${gameId} AND section = ${section} ORDER BY row, seat`);
      return json({ seats: rows });
    }

    if (request.method === 'POST' && url.pathname === '/api/cart/ticket') {
      const body = await request.json().catch(() => ({}));
      const { gameId, section, row, seat } = body as { gameId: number, section: string, row: string, seat: number };
      if (!gameId || !section || !row || !seat) return error(400, 'Missing fields');
      const now = Date.now();
      // Try to reserve atomically: only when available or expired
      const res = await db.run(sql`
        UPDATE tickets
        SET status = 'reserved', reserved_until = ${now + 15*60*1000}
        WHERE game_id = ${gameId}
          AND section = ${section}
          AND row = ${row}
          AND seat = ${seat}
          AND (status = 'available' OR (status = 'reserved' AND (reserved_until IS NULL OR reserved_until < ${now})))
      `);
      // @ts-ignore drizzle returns changes on D1
      const changes = res.meta?.changes ?? res.changes ?? 0;
      if (!changes) return error(409, 'Seat not available');
      // Add to cart in KV
      const cart = await getCart(env, sessionId);
      cart.tickets = cart.tickets || [];
      cart.tickets.push({ gameId, section, row, seat });
      await setCart(env, sessionId, cart);
      return json({ ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/api/cart/product') {
      const body = await request.json().catch(() => ({}));
      const { productId, qty } = body as { productId: number, qty: number };
      if (!productId || !qty) return error(400, 'Missing fields');
      const product = await db.select().from(products).where(eq(products.id, productId)).get();
      if (!product) return error(404, 'Product not found');
      const cart = await getCart(env, sessionId);
      cart.products = cart.products || [];
      const existing = cart.products.find((p: any) => p.productId === productId);
      if (existing) existing.qty += qty;
      else cart.products.push({ productId, qty });
      await setCart(env, sessionId, cart);
      return json({ ok: true });
    }

    if (request.method === 'GET' && url.pathname === '/api/cart') {
      const cart = await getCart(env, sessionId);
      return json({ cart, sessionId });
    }

    if (request.method === 'POST' && url.pathname === '/api/checkout') {
      // Very barebones checkout: creates order and marks reserved tickets as sold
      const cart = await getCart(env, sessionId);
      const items: Array<{ description: string, price: number, quantity: number }> = [];
      let total = 0;

      // Compute total for tickets
      if (cart.tickets?.length) {
        for (const t of cart.tickets) {
          const row = await db.all(sql`SELECT price FROM tickets WHERE game_id = ${t.gameId} AND section = ${t.section} AND row = ${t.row} AND seat = ${t.seat} AND status = 'reserved'`);
          if (!row.length) continue;
          const price = row[0].price as number;
          total += price;
          items.push({ description: `Ticket ${t.section}-${t.row}-${t.seat} (Game ${t.gameId})`, price, quantity: 1 });
        }
      }
      // Compute total for products
      if (cart.products?.length) {
        for (const p of cart.products) {
          const prod = await db.select().from(products).where(eq(products.id, p.productId)).get();
          if (!prod) continue;
          const price = prod.price as number;
          total += price * p.qty;
          items.push({ description: prod.title, price, quantity: p.qty });
        }
      }

      // Store order
      const orderInsert = await db.run(sql`INSERT INTO orders (session_id, total, status, created_at) VALUES (${sessionId}, ${total}, 'pending', ${Date.now()})`);
      // @ts-ignore
      const orderId = orderInsert.meta?.last_row_id || orderInsert.lastRowId || 0;

      for (const it of cart.products || []) {
        const prod = await db.select().from(products).where(eq(products.id, it.productId)).get();
        if (!prod) continue;
        await db.insert(orderItems).values({ orderId, productId: prod.id as number, quantity: it.qty, price: prod.price as number });
      }

      // Mark tickets sold
      for (const t of cart.tickets || []) {
        await db.run(sql`
          UPDATE tickets SET status = 'sold', reserved_until = NULL
          WHERE game_id = ${t.gameId} AND section = ${t.section} AND row = ${t.row} AND seat = ${t.seat} AND status = 'reserved'
        `);
      }

      // Finalize order
      await db.run(sql`UPDATE orders SET status = 'paid' WHERE id = ${orderId}`);

      // Clear cart
      await env.CART.delete(sessionId);

      return json({ ok: true, orderId, total, items });
    }

    // ----------------- Admin auth -----------------
    if (request.method === 'POST' && url.pathname === '/api/admin/register') {
      const body = await request.json().catch(() => ({}));
      const { email, password } = body as { email: string, password: string };
      if (!email || !password) return error(400, 'Missing fields');
      const existing = await db.select().from(admins).where(eq(admins.email, email)).get();
      if (existing) return error(409, 'Admin exists');
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltB64 = btoa(String.fromCharCode(...salt));
      const hash = await pbkdf2(password, saltB64);
      await db.insert(admins).values({ email, passwordHash: hash, salt: saltB64, role: 'owner', createdAt: Date.now() });
      const token = await signJWT({ sub: email, role: 'owner' }, env.ADMIN_JWT_SECRET, 60 * 60 * 8);
      return withAuthCookie(json({ ok: true }), token);
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/login') {
      const body = await request.json().catch(() => ({}));
      const { email, password } = body as { email: string, password: string };
      const row = await db.select().from(admins).where(eq(admins.email, email)).get();
      if (!row) return error(401, 'Invalid credentials');
      const hash = await pbkdf2(password, row.salt as string);
      if (hash !== row.passwordHash) return error(401, 'Invalid credentials');
      const token = await signJWT({ sub: email, role: row.role }, env.ADMIN_JWT_SECRET, 60 * 60 * 8);
      return withAuthCookie(json({ ok: true }), token);
    }

    // ----------------- Admin protected CRUD -----------------
    const user = await requireAdmin(request, env);
    if (!user) return error(401, 'Unauthorized');

    // Design tokens
    if (request.method === 'GET' && url.pathname === '/api/admin/design-tokens') {
      const rows = await db.select().from(designTokens);
      return json({ tokens: rows });
    }
    if (request.method === 'POST' && url.pathname === '/api/admin/design-tokens') {
      const body = await request.json().catch(() => ({}));
      // Expect { key: string, value: string }
      const { key, value } = body as { key: string, value: string };
      if (!key) return error(400, 'Missing key');
      await db.run(sql`INSERT INTO design_tokens (key, value) VALUES (${key}, ${String(value)}) ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
      return json({ ok: true });
    }

    // Settings generic
    if (request.method === 'POST' && url.pathname === '/api/admin/settings') {
      const body = await request.json().catch(() => ({}));
      const { key, value } = body as { key: string, value: unknown };
      if (!key) return error(400, 'Missing key');
      await db.run(sql`INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(value)}) ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
      return json({ ok: true });
    }

    // Players
    if (request.method === 'POST' && url.pathname === '/api/admin/players') {
      const body = await request.json().catch(() => ({}));
      const { name, bio, imageUrl } = body;
      await db.insert(players).values({ name, bio, imageUrl });
      return json({ ok: true });
    }
    if (request.method === 'DELETE' && url.pathname.startsWith('/api/admin/players/')) {
      const id = Number(url.pathname.split('/').pop());
      await db.run(sql`DELETE FROM players WHERE id = ${id}`);
      return json({ ok: true });
    }

    // News
    if (request.method === 'POST' && url.pathname === '/api/admin/news') {
      const body = await request.json().catch(() => ({}));
      const { slug, title, subtitle, body: content, featuredImageUrl, publishedAt } = body;
      await db.insert(news).values({ slug, title, subtitle, body: content, featuredImageUrl, publishedAt });
      return json({ ok: true });
    }

    // Products
    if (request.method === 'POST' && url.pathname === '/api/admin/products') {
      const body = await request.json().catch(() => ({}));
      const { slug, title, description, price, imageUrl } = body;
      await db.insert(products).values({ slug, title, description, price, imageUrl });
      return json({ ok: true });
    }

    // Venue
    if (request.method === 'POST' && url.pathname === '/api/admin/venue') {
      const body = await request.json().catch(() => ({}));
      // { name, config: { sections: [{ name, basePrice, rowStart, rowEnd, seatsPerRow }] } }
      const { name, config } = body;
      await db.insert(venues).values({ name, config: JSON.stringify(config) });
      return json({ ok: true });
    }

    // Games + auto ticket generation
    if (request.method === 'POST' && url.pathname === '/api/admin/games') {
      const body = await request.json().catch(() => ({}));
      const { slug, title, date, opponent, venueId } = body;
      const res = await db.run(sql`INSERT INTO games (slug, title, date, opponent, venue_id) VALUES (${slug}, ${title}, ${date}, ${opponent}, ${venueId})`);
      // @ts-ignore
      const gameId = res.meta?.last_row_id || res.lastRowId;
      const venue = await db.select().from(venues).where(eq(venues.id, Number(venueId))).get();
      if (venue) {
        const cfg = JSON.parse(venue.config as string) as { sections: Array<{ name: string, basePrice: number, rowStart: string, rowEnd: string, seatsPerRow: number }> };
        for (const section of cfg.sections) {
          for (const row of letterRange(section.rowStart, section.rowEnd)) {
            for (let seat = 1; seat <= section.seatsPerRow; seat++) {
              await db.insert(tickets).values({
                gameId: Number(gameId),
                section: section.name,
                row,
                seat,
                price: section.basePrice,
                status: 'available',
                reservedUntil: null
              });
            }
          }
        }
      }
      return json({ ok: true, gameId });
    }

    return error(404, 'Not found');
  }
} satisfies ExportedHandler<Env>;

// -------- Helper functions (module scope) --------

async function getSetting(db: ReturnType<typeof getDb>, key: string): Promise<unknown> {
  const row = await db.select().from(settings).where(eq(settings.key, key)).get();
  try { return row ? JSON.parse(row.value as string) : null; } catch { return row?.value; }
}

function letterRange(start: string, end: string): string[] {
  const s = start.toUpperCase().charCodeAt(0);
  const e = end.toUpperCase().charCodeAt(0);
  const arr: string[] = [];
  for (let c = s; c <= e; c++) arr.push(String.fromCharCode(c));
  return arr;
}

async function pbkdf2(password: string, saltB64: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign', 'verify']
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

async function requireAdmin(request: Request, env: Env) {
  const cookie = request.headers.get('Cookie') || '';
  const token = parseCookie(cookie)['admin_token'];
  if (!token) return null;
  return await verifyJWT(token, env.ADMIN_JWT_SECRET);
}

function withAuthCookie(res: Response, token: string): Response {
  const headers = new Headers(res.headers);
  headers.append('Set-Cookie', `admin_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60*60*8}`);
  return new Response(res.body, { ...res, headers });
}

function parseCookie(cookie: string): Record<string, string> {
  return Object.fromEntries(cookie.split(';').map(v => v.trim().split('=').map(decodeURIComponent)).filter(x => x.length === 2));
}

async function getOrSetSessionId(request: Request, env: Env): Promise<string> {
  const cookie = request.headers.get('Cookie') || '';
  const parsed = parseCookie(cookie);
  if (parsed['sid']) return parsed['sid'];
  const sid = crypto.randomUUID();
  const headers = new Headers({ 'Set-Cookie': `sid=${sid}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60*60*24*7}` });
  return sid;
}

async function getCart(env: Env, sid: string): Promise<any> {
  const txt = await env.CART.get(sid);
  return txt ? JSON.parse(txt) : { products: [], tickets: [] };
}

async function setCart(env: Env, sid: string, data: any): Promise<void> {
  await env.CART.put(sid, JSON.stringify(data), { expirationTtl: 60*60*24 });
}

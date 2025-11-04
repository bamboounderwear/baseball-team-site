import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const designTokens = sqliteTable('design_tokens', {
  key: text('key').primaryKey(),
  value: text('value') // JSON-encoded string or primitive string
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value') // JSON-encoded
});

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  bio: text('bio').notNull(),
  imageUrl: text('image_url').notNull()
});

export const news = sqliteTable('news', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  body: text('body').notNull(),
  featuredImageUrl: text('featured_image_url').notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }).notNull()
});

export const venues = sqliteTable('venues', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  // JSON: { sections: [{ name, basePrice, rowStart, rowEnd, seatsPerRow }] }
  config: text('config').notNull()
});

export const games = sqliteTable('games', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  opponent: text('opponent').notNull(),
  venueId: integer('venue_id').notNull().references(() => venues.id)
});

export const tickets = sqliteTable('tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id').notNull().references(() => games.id),
  section: text('section').notNull(),
  row: text('row').notNull(),       // letter
  seat: integer('seat').notNull(),  // number
  price: real('price').notNull(),
  status: text('status').notNull(), // 'available' | 'reserved' | 'sold'
  reservedUntil: integer('reserved_until', { mode: 'timestamp_ms' })
}, (t) => ({
  uniqSeat: sql`UNIQUE(${t.gameId}, ${t.section}, ${t.row}, ${t.seat})`
}));

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: real('price').notNull(),
  imageUrl: text('image_url').notNull()
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  total: real('total').notNull(),
  status: text('status').notNull(), // 'pending' | 'paid' | 'cancelled'
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  productId: integer('product_id').references(() => products.id),
  // If ticket purchase, store null productId and add meta in a separate table or JSON.
  quantity: integer('quantity').notNull(),
  price: real('price').notNull()
});

export const subscribers = sqliteTable('subscribers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
});

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  role: text('role').notNull(), // 'owner' | 'admin'
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
});

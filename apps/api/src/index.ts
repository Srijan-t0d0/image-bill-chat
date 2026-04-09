import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb } from './db';
import { invoiceRoutes } from './routes/invoices';
import { messageRoutes } from './routes/messages';
import { aiRoutes } from './routes/ai';
import type { Database } from './db';

export type Env = {
  Bindings: {
    DB: D1Database;
    AI: Ai;
  };
  Variables: {
    db: Database;
  };
};

const app = new Hono<Env>();

app.use('*', cors());

// Inject drizzle db instance into context
app.use('*', async (c, next) => {
  c.set('db', createDb(c.env.DB));
  await next();
});

app.get('/health', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }));

app.route('/api/ai', aiRoutes);
app.route('/api/invoices', invoiceRoutes);
app.route('/api/messages', messageRoutes);

export default app;

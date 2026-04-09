import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { invoiceRoutes } from './routes/invoices';
import { messageRoutes } from './routes/messages';

export type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ ok: true, timestamp: new Date().toISOString() }));

app.route('/api/invoices', invoiceRoutes);
app.route('/api/messages', messageRoutes);

export default app;

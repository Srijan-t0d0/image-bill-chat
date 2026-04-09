import { Hono } from 'hono';
import type { Bindings } from '../index';

const messageRoutes = new Hono<{ Bindings: Bindings }>();

// Get all chat messages for an invoice
messageRoutes.get('/:invoiceId', async (c) => {
  const invoiceId = c.req.param('invoiceId');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM chat_messages WHERE invoice_id = ? ORDER BY timestamp ASC',
  ).bind(invoiceId).all();

  return c.json(results ?? []);
});

// Add a single chat message
messageRoutes.post('/:invoiceId', async (c) => {
  const invoiceId = c.req.param('invoiceId');
  const body = await c.req.json();

  await c.env.DB.prepare(`
    INSERT INTO chat_messages (id, invoice_id, role, text, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    body.id,
    invoiceId,
    body.role,
    body.text,
    body.timestamp,
  ).run();

  return c.json({ ok: true }, 201);
});

// Batch add messages (for syncing)
messageRoutes.post('/:invoiceId/batch', async (c) => {
  const invoiceId = c.req.param('invoiceId');
  const { messages } = await c.req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: 'messages array is required' }, 400);
  }

  const stmt = c.env.DB.prepare(`
    INSERT OR IGNORE INTO chat_messages (id, invoice_id, role, text, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);

  const batch = messages.map((msg: { id: string; role: string; text: string; timestamp: number }) =>
    stmt.bind(msg.id, invoiceId, msg.role, msg.text, msg.timestamp),
  );

  await c.env.DB.batch(batch);

  return c.json({ ok: true, count: messages.length }, 201);
});

export { messageRoutes };

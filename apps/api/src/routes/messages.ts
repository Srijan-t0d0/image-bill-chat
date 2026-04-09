import { Hono } from 'hono';
import { eq, asc } from 'drizzle-orm';
import { chatMessages } from '../db/schema';
import type { Env } from '../index';

const messageRoutes = new Hono<Env>();

// Get all chat messages for an invoice
messageRoutes.get('/:invoiceId', async (c) => {
  const db = c.get('db');
  const invoiceId = c.req.param('invoiceId');

  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.invoiceId, invoiceId))
    .orderBy(asc(chatMessages.timestamp));

  return c.json(rows);
});

// Add a single chat message
messageRoutes.post('/:invoiceId', async (c) => {
  const db = c.get('db');
  const invoiceId = c.req.param('invoiceId');
  const body = await c.req.json();

  await db.insert(chatMessages).values({
    id: body.id,
    invoiceId,
    role: body.role,
    text: body.text,
    timestamp: body.timestamp,
  });

  return c.json({ ok: true }, 201);
});

// Batch add messages (for syncing)
messageRoutes.post('/:invoiceId/batch', async (c) => {
  const db = c.get('db');
  const invoiceId = c.req.param('invoiceId');
  const { messages } = await c.req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: 'messages array is required' }, 400);
  }

  const values = messages.map(
    (msg: { id: string; role: string; text: string; timestamp: number }) => ({
      id: msg.id,
      invoiceId,
      role: msg.role,
      text: msg.text,
      timestamp: msg.timestamp,
    }),
  );

  await db.insert(chatMessages).values(values).onConflictDoNothing();

  return c.json({ ok: true, count: messages.length }, 201);
});

export { messageRoutes };

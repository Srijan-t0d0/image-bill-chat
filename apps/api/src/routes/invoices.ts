import { Hono } from 'hono';
import type { Bindings } from '../index';
import { invoiceSchema } from '@image-bill-chat/shared';

const invoiceRoutes = new Hono<{ Bindings: Bindings }>();

// Create invoice
invoiceRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = invoiceSchema.parse(body);
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO invoices (
      id, invoice_number, customer_name, customer_address,
      venue_name, project_name, event_date, duration_days,
      subtotal, amount_paid, total_due, confidence_score,
      needs_review, notes, line_items_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    parsed.invoice_number,
    parsed.customer_name,
    parsed.customer_address,
    parsed.venue_name,
    parsed.project_name,
    parsed.event_date,
    parsed.duration_days,
    parsed.subtotal,
    parsed.amount_paid,
    parsed.total_due,
    parsed.confidence_score,
    parsed.needs_review ? 1 : 0,
    parsed.notes,
    JSON.stringify(parsed.line_items),
  ).run();

  return c.json({ id, ...parsed }, 201);
});

// List invoices (paginated)
invoiceRoutes.get('/', async (c) => {
  const limit = Number(c.req.query('limit') || '20');
  const offset = Number(c.req.query('offset') || '0');

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM invoices ORDER BY created_at DESC LIMIT ? OFFSET ?',
  ).bind(limit, offset).all();

  const invoices = (results ?? []).map((r) => ({
    ...r,
    line_items: JSON.parse(r.line_items_json as string),
    line_items_json: undefined,
    needs_review: r.needs_review === 1,
  }));

  return c.json(invoices);
});

// Get single invoice
invoiceRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(
    'SELECT * FROM invoices WHERE id = ?',
  ).bind(id).first();

  if (!row) return c.json({ error: 'Invoice not found' }, 404);

  return c.json({
    ...row,
    line_items: JSON.parse(row.line_items_json as string),
    line_items_json: undefined,
    needs_review: row.needs_review === 1,
  });
});

// Update invoice
invoiceRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = invoiceSchema.parse(body);

  await c.env.DB.prepare(`
    UPDATE invoices SET
      invoice_number = ?, customer_name = ?, customer_address = ?,
      venue_name = ?, project_name = ?, event_date = ?, duration_days = ?,
      subtotal = ?, amount_paid = ?, total_due = ?, confidence_score = ?,
      needs_review = ?, notes = ?, line_items_json = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    parsed.invoice_number,
    parsed.customer_name,
    parsed.customer_address,
    parsed.venue_name,
    parsed.project_name,
    parsed.event_date,
    parsed.duration_days,
    parsed.subtotal,
    parsed.amount_paid,
    parsed.total_due,
    parsed.confidence_score,
    parsed.needs_review ? 1 : 0,
    parsed.notes,
    JSON.stringify(parsed.line_items),
    id,
  ).run();

  return c.json({ id, ...parsed });
});

// Delete invoice
invoiceRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM invoices WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

// Get edit history for an invoice
invoiceRoutes.get('/:id/history', async (c) => {
  const id = c.req.param('id');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM invoice_edits WHERE invoice_id = ? ORDER BY created_at DESC',
  ).bind(id).all();

  const edits = (results ?? []).map((r) => ({
    ...r,
    invoice_before: JSON.parse(r.invoice_before_json as string),
    invoice_after: JSON.parse(r.invoice_after_json as string),
    invoice_before_json: undefined,
    invoice_after_json: undefined,
  }));

  return c.json(edits);
});

// Save an edit snapshot
invoiceRoutes.post('/:id/edits', async (c) => {
  const invoiceId = c.req.param('id');
  const body = await c.req.json();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO invoice_edits (id, invoice_id, message_id, instruction, invoice_before_json, invoice_after_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    invoiceId,
    body.message_id || null,
    body.instruction,
    JSON.stringify(body.invoice_before),
    JSON.stringify(body.invoice_after),
  ).run();

  return c.json({ id }, 201);
});

export { invoiceRoutes };

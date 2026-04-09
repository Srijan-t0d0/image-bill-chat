import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { invoices, invoiceEdits } from '../db/schema';
import { invoiceSchema } from '@image-bill-chat/shared';
import type { Env } from '../index';

const invoiceRoutes = new Hono<Env>();

// Create invoice
invoiceRoutes.post('/', async (c) => {
  const db = c.get('db');
  const body = await c.req.json();
  const parsed = invoiceSchema.parse(body);
  const id = crypto.randomUUID();

  await db.insert(invoices).values({
    id,
    invoiceNumber: parsed.invoice_number,
    customerName: parsed.customer_name,
    customerAddress: parsed.customer_address,
    venueName: parsed.venue_name,
    projectName: parsed.project_name,
    eventDate: parsed.event_date,
    durationDays: parsed.duration_days,
    subtotal: parsed.subtotal,
    amountPaid: parsed.amount_paid,
    totalDue: parsed.total_due,
    confidenceScore: parsed.confidence_score,
    needsReview: parsed.needs_review,
    notes: parsed.notes,
    lineItemsJson: JSON.stringify(parsed.line_items),
  });

  return c.json({ id, ...parsed }, 201);
});

// List invoices (paginated)
invoiceRoutes.get('/', async (c) => {
  const db = c.get('db');
  const limit = Number(c.req.query('limit') || '20');
  const offset = Number(c.req.query('offset') || '0');

  const rows = await db
    .select()
    .from(invoices)
    .orderBy(desc(invoices.createdAt))
    .limit(limit)
    .offset(offset);

  const result = rows.map((r) => ({
    ...r,
    line_items: JSON.parse(r.lineItemsJson),
    lineItemsJson: undefined,
  }));

  return c.json(result);
});

// Get single invoice
invoiceRoutes.get('/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const row = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .get();

  if (!row) return c.json({ error: 'Invoice not found' }, 404);

  return c.json({
    ...row,
    line_items: JSON.parse(row.lineItemsJson),
    lineItemsJson: undefined,
  });
});

// Update invoice
invoiceRoutes.put('/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = invoiceSchema.parse(body);

  await db
    .update(invoices)
    .set({
      invoiceNumber: parsed.invoice_number,
      customerName: parsed.customer_name,
      customerAddress: parsed.customer_address,
      venueName: parsed.venue_name,
      projectName: parsed.project_name,
      eventDate: parsed.event_date,
      durationDays: parsed.duration_days,
      subtotal: parsed.subtotal,
      amountPaid: parsed.amount_paid,
      totalDue: parsed.total_due,
      confidenceScore: parsed.confidence_score,
      needsReview: parsed.needs_review,
      notes: parsed.notes,
      lineItemsJson: JSON.stringify(parsed.line_items),
    })
    .where(eq(invoices.id, id));

  return c.json({ id, ...parsed });
});

// Delete invoice
invoiceRoutes.delete('/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');
  await db.delete(invoices).where(eq(invoices.id, id));
  return c.json({ ok: true });
});

// Get edit history for an invoice
invoiceRoutes.get('/:id/history', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const rows = await db
    .select()
    .from(invoiceEdits)
    .where(eq(invoiceEdits.invoiceId, id))
    .orderBy(desc(invoiceEdits.createdAt));

  const edits = rows.map((r) => ({
    ...r,
    invoice_before: JSON.parse(r.invoiceBeforeJson),
    invoice_after: JSON.parse(r.invoiceAfterJson),
    invoiceBeforeJson: undefined,
    invoiceAfterJson: undefined,
  }));

  return c.json(edits);
});

// Save an edit snapshot
invoiceRoutes.post('/:id/edits', async (c) => {
  const db = c.get('db');
  const invoiceId = c.req.param('id');
  const body = await c.req.json();
  const id = crypto.randomUUID();

  await db.insert(invoiceEdits).values({
    id,
    invoiceId,
    messageId: body.message_id || null,
    instruction: body.instruction,
    invoiceBeforeJson: JSON.stringify(body.invoice_before),
    invoiceAfterJson: JSON.stringify(body.invoice_after),
  });

  return c.json({ id }, 201);
});

export { invoiceRoutes };

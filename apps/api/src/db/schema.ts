import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull(),
  customerName: text('customer_name').notNull(),
  customerAddress: text('customer_address').default(''),
  venueName: text('venue_name').default(''),
  projectName: text('project_name').default(''),
  eventDate: text('event_date').default(''),
  durationDays: integer('duration_days').default(1),
  subtotal: real('subtotal').default(0),
  amountPaid: real('amount_paid').default(0),
  totalDue: real('total_due').default(0),
  confidenceScore: real('confidence_score').default(0),
  needsReview: integer('needs_review', { mode: 'boolean' }).default(false),
  notes: text('notes').default(''),
  lineItemsJson: text('line_items_json').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  text: text('text').notNull(),
  timestamp: integer('timestamp').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const invoiceEdits = sqliteTable('invoice_edits', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  messageId: text('message_id').references(() => chatMessages.id, {
    onDelete: 'set null',
  }),
  instruction: text('instruction').notNull(),
  invoiceBeforeJson: text('invoice_before_json').notNull(),
  invoiceAfterJson: text('invoice_after_json').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

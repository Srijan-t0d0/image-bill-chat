import { z } from 'zod';

export const billLineItemSchema = z.object({
  id: z.string().describe('Unique item ID like "item-1"'),
  description: z.string().describe('Name of equipment or service'),
  unit_price: z.number().describe('Price per unit in INR'),
  units: z.number().describe('Quantity / number of units'),
  days: z.number().describe('Number of days (usually 1)'),
  tax_amount: z.number().describe('GST 18% amount for this item'),
  amount: z.number().describe('Total: unit_price * units * days + tax_amount'),
});

export const invoiceSchema = z.object({
  event_date: z.string().describe('Date of event, e.g. "24JAN2026"'),
  duration_days: z.number().describe('Duration in days'),
  invoice_number: z.string().describe('Invoice reference number'),

  customer_name: z.string().describe('Client / customer name'),
  customer_address: z.string().describe('Client address or city'),

  venue_name: z.string().describe('Event venue name'),
  project_name: z.string().describe('Project description, may be in Hindi'),

  line_items: z.array(billLineItemSchema).describe('All billed items/services'),

  subtotal: z.number().describe('Sum of all item amounts'),
  amount_paid: z.number().describe('Amount already paid'),
  total_due: z.number().describe('subtotal - amount_paid'),

  confidence_score: z
    .number()
    .describe('OCR confidence 0-1'),
  needs_review: z.boolean().describe('True if data quality is uncertain'),
  notes: z.string().describe('Additional notes or warnings'),
});

export type InvoiceSchema = z.infer<typeof invoiceSchema>;
export type BillLineItemSchema = z.infer<typeof billLineItemSchema>;

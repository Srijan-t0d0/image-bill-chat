import type { Invoice } from '../../types/bill';
import { TAX_RATE } from '../../constants/business';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAndFixBill(bill: Invoice): Invoice {
  const fixed = { ...bill, line_items: bill.line_items.map((item) => {
    const base = item.unit_price * item.units * item.days;
    const tax = Math.round(base * (TAX_RATE / 100));
    const amount = base + tax;
    return { ...item, tax_amount: tax, amount };
  })};

  fixed.subtotal = fixed.line_items.reduce((sum, item) => sum + item.amount, 0);
  fixed.total_due = fixed.subtotal - fixed.amount_paid;

  return fixed;
}

export function validateBill(bill: Invoice): ValidationResult {
  const errors: string[] = [];

  if (!bill.customer_name) {
    errors.push('Missing customer name');
  }
  if (!bill.line_items || bill.line_items.length === 0) {
    errors.push('No line items found');
  }

  for (const item of bill.line_items) {
    const expectedBase = item.unit_price * item.units * item.days;
    const expectedTax = Math.round(expectedBase * (TAX_RATE / 100));
    const expectedAmount = expectedBase + expectedTax;

    if (Math.abs(item.amount - expectedAmount) > 1) {
      errors.push(
        `Item "${item.description}": amount ${item.amount} != expected ${expectedAmount}`,
      );
    }
  }

  const calcSubtotal = bill.line_items.reduce((sum, i) => sum + i.amount, 0);
  if (Math.abs(bill.subtotal - calcSubtotal) > 1) {
    errors.push(
      `Subtotal ${bill.subtotal} != sum of items ${calcSubtotal}`,
    );
  }

  return { valid: errors.length === 0, errors };
}

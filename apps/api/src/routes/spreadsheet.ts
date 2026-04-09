import { Hono } from 'hono';
import * as XLSX from 'xlsx';
import { invoiceSchema } from '@image-bill-chat/shared';
import type { Env } from '../index';

const spreadsheetRoutes = new Hono<Env>();

/**
 * POST /api/spreadsheet/generate
 * Body: { invoice: Invoice, business: BusinessProfile }
 * Returns: .xlsx file as binary
 *
 * Generates a spreadsheet matching the original invoice template with
 * real Excel formulas for GST, subtotals, and totals.
 */
spreadsheetRoutes.post('/generate', async (c) => {
  const { invoice, business } = await c.req.json();

  if (!invoice || !business) {
    return c.json({ error: 'invoice and business are required' }, 400);
  }

  const wb = XLSX.utils.book_new();
  const rows: any[][] = [];

  // === ROW 1: Empty spacer ===
  rows.push([]);

  // === ROW 2: PAN + GSTIN ===
  rows.push([
    business.pan ? `PAN: ${business.pan}` : '',
    '', '', '', '', '', '',
    business.gstin ? `GSTIN: ${business.gstin}` : '',
  ]);

  // === ROW 3: Business Name + Services header ===
  rows.push([
    business.name,
    '', '', '', '', '',
    'Our services',
  ]);

  // === ROW 4-6: Address + Services list ===
  const services = business.services || [];
  rows.push([business.address || '', '', '', '', '', '', services[0] || '']);
  rows.push(['', '', '', '', '', '', services[1] || '']);
  rows.push([
    business.phone || '',
    '', '', '', '', '',
    services[2] || '',
  ]);

  // === ROW 7: UDYAM ===
  rows.push([business.udyam || '']);

  // === ROW 8: Email ===
  rows.push([business.email ? `E-mail: ${business.email}` : '']);

  // === ROW 9: INVOICE title ===
  rows.push(['Invoice']);

  // === ROW 10: Date of event ===
  rows.push([`Date of event: ${invoice.event_date}`]);

  // === ROW 11: Duration ===
  rows.push([`Duration of event: ${invoice.duration_days} Days`]);

  // === ROW 12: Invoice for / Payable to / Invoice# headers ===
  rows.push(['Invoice for', '', '', 'Payable to', '', '', 'Invoice#']);

  // === ROW 13: Customer / Business / Invoice number ===
  rows.push([
    invoice.customer_name,
    '', '',
    business.name,
    '', '',
    invoice.invoice_number,
  ]);

  // === ROW 14: Customer address ===
  rows.push([invoice.customer_address || '']);

  // === ROW 15: Venue / Project headers ===
  rows.push(['Venue', '', '', 'Project name']);

  // === ROW 16-17: Venue / Project values ===
  rows.push([invoice.venue_name || '', '', '', invoice.project_name || '']);
  rows.push([]);

  // === ROW 18: Table headers ===
  // Columns: A=Description, D=Unit price, E=Unit, F=Days, G=Tax(GST 18%), H=Amount
  rows.push(['Description', '', '', 'Unit price', 'Unit', 'Days', 'Tax(GST 18%)', 'Amount']);

  // === ROWS 19+: Line items with FORMULAS ===
  const firstItemRow = 19; // 1-indexed Excel row
  const items = invoice.line_items || [];

  items.forEach((item: any, i: number) => {
    const row = firstItemRow + i; // Excel row number (1-indexed)
    // D=unit_price, E=units, F=days
    // G (Tax) = D*E*F*0.18  → formula
    // H (Amount) = D*E*F + G → formula
    rows.push([
      item.description,
      '', '',
      item.unit_price,
      item.units,
      item.days,
      { f: `D${row}*E${row}*F${row}*0.18` },       // Tax formula
      { f: `D${row}*E${row}*F${row}+G${row}` },     // Amount formula
    ]);
  });

  const lastItemRow = firstItemRow + items.length - 1;

  // === Bank details + Subtotal row ===
  const subtotalRow = lastItemRow + 1;
  rows.push([
    'Bank details', '', '',
    'Subtotal', '', '', '',
    { f: `SUM(H${firstItemRow}:H${lastItemRow})` },  // Subtotal formula
  ]);

  // === Bank holder + Total in words ===
  rows.push([
    business.bank?.holder ? `Holder's name: ${business.bank.holder}` : '',
    '', '',
    'Total in words', '',
    '', '', '',
  ]);

  // === Bank name ===
  rows.push([
    business.bank?.bank_name ? `Bank name: ${business.bank.bank_name}` : '',
  ]);

  // === IFSC + Total payable ===
  const totalPayableRow = subtotalRow + 3;
  rows.push([
    business.bank?.ifsc ? `IFSC code: ${business.bank.ifsc}` : '',
    '', '', '', '', '',
    'Total payable',
    { f: `H${subtotalRow}` },  // = Subtotal
  ]);

  // === Account + Amount Paid ===
  rows.push([
    business.bank?.account ? `A/c no: ${business.bank.account}` : '',
    '', '', '', '', '',
    'Amount Paid',
    invoice.amount_paid || 0,
  ]);

  // === Total Due ===
  const amountPaidRow = totalPayableRow + 1;
  rows.push([
    '', '', '', '', '', '',
    'Total Due',
    { f: `H${totalPayableRow}-H${amountPaidRow}` },  // Total payable - Amount paid
  ]);

  // === Signature ===
  rows.push([]);
  rows.push(['Signature']);
  rows.push(['...................................................................']);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths matching the original template
  ws['!cols'] = [
    { wch: 30 }, // A - Description
    { wch: 4 },  // B
    { wch: 4 },  // C
    { wch: 12 }, // D - Unit price
    { wch: 6 },  // E - Units
    { wch: 6 },  // F - Days
    { wch: 14 }, // G - Tax
    { wch: 14 }, // H - Amount
  ];

  // Number format for currency columns
  const numFmt = '#,##0';
  for (let r = firstItemRow; r <= lastItemRow; r++) {
    const cells = ['D', 'G', 'H'];
    cells.forEach((col) => {
      const ref = `${col}${r}`;
      if (ws[ref]) ws[ref].z = numFmt;
    });
  }
  // Format subtotal and totals
  if (ws[`H${subtotalRow}`]) ws[`H${subtotalRow}`].z = numFmt;
  if (ws[`H${totalPayableRow}`]) ws[`H${totalPayableRow}`].z = numFmt;
  if (ws[`H${totalPayableRow + 2}`]) ws[`H${totalPayableRow + 2}`].z = numFmt;

  XLSX.utils.book_append_sheet(wb, ws, 'Invoice');

  // Generate buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const filename = `Invoice_${invoice.invoice_number || 'draft'}_${invoice.event_date || 'undated'}.xlsx`;

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Access-Control-Allow-Origin': '*',
    },
  });
});

export { spreadsheetRoutes };

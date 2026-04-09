import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Invoice } from '../types/bill';
import type { BusinessProfile } from '../constants/business';
import { TAX_RATE } from '../constants/business';
import { formatINR, numberToWords, capitalize } from '../utils/formatters';

function generateBillHTML(invoice: Invoice, business: BusinessProfile): string {
  const itemsHTML = invoice.line_items
    .map(
      (item, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td>${item.description}</td>
      <td class="num">${formatINR(item.unit_price)}</td>
      <td class="num">${item.units}</td>
      <td class="num">${item.days}</td>
      <td class="num">${formatINR(item.tax_amount)}</td>
      <td class="num">${formatINR(item.amount)}</td>
    </tr>`,
    )
    .join('\n');

  const totalWords = capitalize(numberToWords(invoice.subtotal)) + ' rupees only';

  const servicesLine = business.services.length > 0
    ? `<p class="services">Services: ${business.services.join(' | ')}</p>`
    : '';

  const panLine = business.pan ? `PAN: ${business.pan}` : '';
  const gstinLine = business.gstin ? `GSTIN: ${business.gstin}` : '';
  const taxIdLine = [panLine, gstinLine].filter(Boolean).join(' | ');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #222; padding: 20px; }
  .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 10px; }
  .header h1 { font-size: 20px; letter-spacing: 1px; margin-bottom: 2px; }
  .header p { font-size: 10px; color: #555; margin: 1px 0; }
  .services { font-size: 9px; color: #777; margin-top: 4px; }
  .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .meta-box { flex: 1; }
  .meta-box h3 { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 3px; }
  .meta-box p { font-size: 11px; margin: 1px 0; }
  .invoice-title { text-align: center; font-size: 16px; font-weight: bold; margin: 12px 0 8px; text-transform: uppercase; letter-spacing: 2px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th { background: #333; color: #fff; padding: 6px 4px; font-size: 10px; text-align: left; }
  td { padding: 5px 4px; border-bottom: 1px solid #ddd; font-size: 10px; }
  td.num, th.num { text-align: right; }
  .footer { display: flex; justify-content: space-between; margin-top: 10px; }
  .bank-details { flex: 1; font-size: 10px; }
  .bank-details h3 { font-size: 11px; margin-bottom: 4px; }
  .bank-details p { margin: 1px 0; }
  .totals { width: 220px; }
  .totals table { margin: 0; }
  .totals td { font-size: 10px; padding: 3px 4px; }
  .totals .total-row { font-weight: bold; font-size: 12px; background: #f0f0f0; }
  .words { margin-top: 8px; font-size: 10px; font-style: italic; border-top: 1px solid #ccc; padding-top: 6px; }
  .signature { text-align: right; margin-top: 30px; font-size: 10px; }
  .signature-line { border-top: 1px solid #333; display: inline-block; width: 180px; margin-bottom: 4px; }
</style>
</head>
<body>

<div class="header">
  <h1>${business.name}</h1>
  ${business.address ? `<p>${business.address}</p>` : ''}
  ${business.phone || business.email ? `<p>${[business.phone ? `Phone: ${business.phone}` : '', business.email ? `Email: ${business.email}` : ''].filter(Boolean).join(' | ')}</p>` : ''}
  ${taxIdLine ? `<p>${taxIdLine}</p>` : ''}
  ${business.udyam ? `<p>${business.udyam}</p>` : ''}
  ${servicesLine}
</div>

<div class="invoice-title">Invoice</div>

<div class="meta-row">
  <div class="meta-box">
    <h3>Invoice For</h3>
    <p><strong>${invoice.customer_name}</strong></p>
    <p>${invoice.customer_address}</p>
  </div>
  <div class="meta-box">
    <h3>Venue & Project</h3>
    <p>${invoice.venue_name}</p>
    <p>${invoice.project_name}</p>
  </div>
  <div class="meta-box" style="text-align: right;">
    <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
    <p><strong>Date:</strong> ${invoice.event_date}</p>
    <p><strong>Duration:</strong> ${invoice.duration_days} Day${invoice.duration_days > 1 ? 's' : ''}</p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:30px">#</th>
      <th>Description</th>
      <th class="num">Unit Price</th>
      <th class="num">Units</th>
      <th class="num">Days</th>
      <th class="num">GST ${TAX_RATE}%</th>
      <th class="num">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${itemsHTML}
  </tbody>
</table>

<div class="footer">
  ${business.bank.holder ? `
  <div class="bank-details">
    <h3>Bank Details</h3>
    <p><strong>Name:</strong> ${business.bank.holder}</p>
    ${business.bank.bank_name ? `<p><strong>Bank:</strong> ${business.bank.bank_name}</p>` : ''}
    ${business.bank.account ? `<p><strong>A/C:</strong> ${business.bank.account}</p>` : ''}
    ${business.bank.ifsc ? `<p><strong>IFSC:</strong> ${business.bank.ifsc}</p>` : ''}
  </div>` : '<div class="bank-details"></div>'}
  <div class="totals">
    <table>
      <tr>
        <td><strong>Subtotal</strong></td>
        <td class="num"><strong>${formatINR(invoice.subtotal)}</strong></td>
      </tr>
      <tr>
        <td>Amount Paid</td>
        <td class="num">${formatINR(invoice.amount_paid)}</td>
      </tr>
      <tr class="total-row">
        <td>Total Due</td>
        <td class="num">${formatINR(invoice.total_due)}</td>
      </tr>
    </table>
  </div>
</div>

<div class="words">
  <strong>Total in words:</strong> ${totalWords}
</div>

<div class="signature">
  <div class="signature-line"></div>
  <br/>
  Authorized Signature
</div>

</body>
</html>`;
}

export async function generatePDF(invoice: Invoice, business: BusinessProfile): Promise<string> {
  const html = generateBillHTML(invoice, business);
  const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
  return uri;
}

export async function sharePDF(fileUri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share Invoice PDF',
  });
}

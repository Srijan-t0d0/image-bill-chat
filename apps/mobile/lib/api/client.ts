import { File, Paths } from 'expo-file-system/next';
import type { Invoice, ChatMessage } from '../../types/bill';
import type { BusinessProfile } from '../../constants/business';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }
  return res.json();
}

export const api = {
  // AI endpoints
  extractBill: (image: string) =>
    request<Invoice>('/api/ai/extract', {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),

  editBill: (invoice: Invoice, instruction: string) =>
    request<Invoice>('/api/ai/edit', {
      method: 'POST',
      body: JSON.stringify({ invoice, instruction }),
    }),

  // Spreadsheet generation
  generateSpreadsheet: async (
    invoice: Invoice,
    business: BusinessProfile,
  ): Promise<string> => {
    const res = await fetch(`${API_BASE}/api/spreadsheet/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice, business }),
    });
    if (!res.ok) {
      throw new Error('Failed to generate spreadsheet');
    }

    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const filename = `Invoice_${invoice.invoice_number || 'draft'}.xlsx`;
    const file = new File(Paths.cache, filename);
    file.write(bytes);

    return file.uri;
  },

  // Invoices
  createInvoice: (invoice: Invoice) =>
    request<{ id: string } & Invoice>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    }),

  getInvoices: (limit = 20, offset = 0) =>
    request<Invoice[]>(`/api/invoices?limit=${limit}&offset=${offset}`),

  getInvoice: (id: string) =>
    request<Invoice>(`/api/invoices/${id}`),

  updateInvoice: (id: string, invoice: Invoice) =>
    request<Invoice>(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoice),
    }),

  deleteInvoice: (id: string) =>
    request<{ ok: boolean }>(`/api/invoices/${id}`, { method: 'DELETE' }),

  // Chat messages
  getMessages: (invoiceId: string) =>
    request<ChatMessage[]>(`/api/messages/${invoiceId}`),

  addMessage: (invoiceId: string, message: ChatMessage) =>
    request<{ ok: boolean }>(`/api/messages/${invoiceId}`, {
      method: 'POST',
      body: JSON.stringify(message),
    }),

  batchAddMessages: (invoiceId: string, messages: ChatMessage[]) =>
    request<{ ok: boolean; count: number }>(`/api/messages/${invoiceId}/batch`, {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),

  // Edit history
  saveEdit: (
    invoiceId: string,
    edit: {
      instruction: string;
      invoice_before: Invoice;
      invoice_after: Invoice;
      message_id?: string;
    },
  ) =>
    request<{ id: string }>(`/api/invoices/${invoiceId}/edits`, {
      method: 'POST',
      body: JSON.stringify(edit),
    }),

  getEditHistory: (invoiceId: string) =>
    request<Array<{
      id: string;
      instruction: string;
      invoice_before: Invoice;
      invoice_after: Invoice;
      created_at: string;
    }>>(`/api/invoices/${invoiceId}/history`),
};

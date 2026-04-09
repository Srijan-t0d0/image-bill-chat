export interface BillLineItem {
  id: string;
  description: string;
  unit_price: number;
  units: number;
  days: number;
  tax_amount: number;
  amount: number;
}

export interface Invoice {
  event_date: string;
  duration_days: number;
  invoice_number: string;

  customer_name: string;
  customer_address: string;

  venue_name: string;
  project_name: string;

  line_items: BillLineItem[];

  subtotal: number;
  amount_paid: number;
  total_due: number;

  confidence_score: number;
  needs_review: boolean;
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

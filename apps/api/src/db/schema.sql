-- Invoices table: stores full invoice data with line_items as JSON
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT DEFAULT '',
  venue_name TEXT DEFAULT '',
  project_name TEXT DEFAULT '',
  event_date TEXT DEFAULT '',
  duration_days INTEGER DEFAULT 1,
  subtotal REAL DEFAULT 0,
  amount_paid REAL DEFAULT 0,
  total_due REAL DEFAULT 0,
  confidence_score REAL DEFAULT 0,
  needs_review INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  line_items_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Chat messages linked to an invoice
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Edit snapshots: before/after for each NL edit
CREATE TABLE IF NOT EXISTS invoice_edits (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  message_id TEXT,
  instruction TEXT NOT NULL,
  invoice_before_json TEXT NOT NULL,
  invoice_after_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_invoice ON chat_messages(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_edits_invoice ON invoice_edits(invoice_id);

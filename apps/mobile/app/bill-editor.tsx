import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useBillStore } from '../store/billStore';
import { editBillWithNL } from '../lib/ai/edit-bill';
import { validateAndFixBill } from '../lib/validation/validate-bill';
import { generatePDF } from '../services/pdf';
import { BillItemRow } from '../components/BillItemRow';
import { BillSummary } from '../components/BillSummary';
import { ChatInput } from '../components/ChatInput';
import { ChatBubble } from '../components/ChatBubble';
import { EditableField } from '../components/EditableField';
import { useProfileStore } from '../store/profileStore';
import { api } from '../lib/api/client';
import type { Invoice, BillLineItem, ChatMessage } from '../types/bill';
import { TAX_RATE } from '../constants/business';

export default function BillEditorScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { profile } = useProfileStore();
  const {
    invoice,
    setInvoice,
    chatMessages,
    addChatMessage,
    isEditing,
    setEditing,
    setPdfUri,
  } = useBillStore();

  if (!invoice) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No invoice data. Please scan a bill first.</Text>
        <TouchableOpacity style={styles.goBack} onPress={() => router.replace('/')}>
          <Text style={styles.goBackText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Inline edit: update a top-level invoice field ──
  const updateField = (field: keyof Invoice, value: string | number) => {
    const updated = { ...invoice, [field]: value };
    setInvoice(validateAndFixBill(updated));
  };

  // ── Inline edit: update a line item field + recalculate ──
  const updateItemField = (
    itemId: string,
    field: keyof BillLineItem,
    value: string | number,
  ) => {
    const updatedItems = invoice.line_items.map((item) => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      // Recalculate this item's tax and amount
      const base = updated.unit_price * updated.units * updated.days;
      updated.tax_amount = Math.round(base * (TAX_RATE / 100));
      updated.amount = base + updated.tax_amount;
      return updated;
    });
    const updatedInvoice: Invoice = {
      ...invoice,
      line_items: updatedItems,
      subtotal: updatedItems.reduce((sum, i) => sum + i.amount, 0),
      total_due: 0,
    };
    updatedInvoice.total_due = updatedInvoice.subtotal - updatedInvoice.amount_paid;
    setInvoice(updatedInvoice);
  };

  // ── Add a new empty line item ──
  const addItem = () => {
    const newItem: BillLineItem = {
      id: `item-${Crypto.randomUUID().slice(0, 8)}`,
      description: '',
      unit_price: 0,
      units: 1,
      days: 1,
      tax_amount: 0,
      amount: 0,
    };
    const updated: Invoice = {
      ...invoice,
      line_items: [...invoice.line_items, newItem],
    };
    setInvoice(updated);
  };

  // ── Remove a line item ──
  const removeItem = (itemId: string) => {
    const updatedItems = invoice.line_items.filter((i) => i.id !== itemId);
    const subtotal = updatedItems.reduce((sum, i) => sum + i.amount, 0);
    setInvoice({
      ...invoice,
      line_items: updatedItems,
      subtotal,
      total_due: subtotal - invoice.amount_paid,
    });
  };

  // ── NL edit via AI ──
  const handleNLEdit = async (instruction: string) => {
    const userMsg: ChatMessage = {
      id: Crypto.randomUUID(),
      role: 'user',
      text: instruction,
      timestamp: Date.now(),
    };
    addChatMessage(userMsg);
    setEditing(true);

    try {
      const rawUpdated = await editBillWithNL(invoice, instruction);
      const fixedUpdated = validateAndFixBill(rawUpdated);
      setInvoice(fixedUpdated);

      const assistantMsg: ChatMessage = {
        id: Crypto.randomUUID(),
        role: 'assistant',
        text: fixedUpdated.notes || 'Done! Invoice updated.',
        timestamp: Date.now(),
      };
      addChatMessage(assistantMsg);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to apply edit.';
      const errorMsg: ChatMessage = {
        id: Crypto.randomUUID(),
        role: 'assistant',
        text: `Error: ${message}`,
        timestamp: Date.now(),
      };
      addChatMessage(errorMsg);
    } finally {
      setEditing(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const uri = await generatePDF(invoice, profile);
      setPdfUri(uri);
      router.push('/pdf-preview');
    } catch {
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  const handleGenerateXLSX = async () => {
    try {
      const uri = await api.generateSpreadsheet(invoice, profile);
      setPdfUri(uri);
      router.push('/pdf-preview');
    } catch {
      Alert.alert('Error', 'Failed to generate spreadsheet.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Invoice Header */}
        <View style={styles.header}>
          <Text style={styles.businessName}>{profile.name}</Text>
          {profile.gstin ? (
            <Text style={styles.headerDetail}>GSTIN: {profile.gstin}</Text>
          ) : null}
        </View>

        {/* Editable Meta Info */}
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Customer</Text>
            <EditableField
              value={invoice.customer_name}
              onSave={(v) => updateField('customer_name', v)}
              style={styles.metaValue}
              placeholder="Customer name"
            />
            <EditableField
              value={invoice.customer_address}
              onSave={(v) => updateField('customer_address', v)}
              style={styles.metaSub}
              placeholder="Address"
            />
          </View>
          <View style={[styles.metaBox, styles.metaRight]}>
            <Text style={styles.metaLabel}>Invoice #</Text>
            <EditableField
              value={invoice.invoice_number}
              onSave={(v) => updateField('invoice_number', v)}
              style={{ ...styles.metaValue, textAlign: 'right' }}
              placeholder="INV-001"
            />
            <EditableField
              value={invoice.event_date}
              onSave={(v) => updateField('event_date', v)}
              style={{ ...styles.metaSub, textAlign: 'right' }}
              placeholder="Date"
            />
          </View>
        </View>

        {/* Editable Venue */}
        <View style={styles.venueBox}>
          <Text style={styles.metaLabel}>Venue</Text>
          <EditableField
            value={invoice.venue_name}
            onSave={(v) => updateField('venue_name', v)}
            style={styles.metaValue}
            placeholder="Venue name"
          />
          <EditableField
            value={invoice.project_name}
            onSave={(v) => updateField('project_name', v)}
            style={styles.metaSub}
            placeholder="Project name"
          />
        </View>

        {/* Items Header */}
        <View style={styles.itemsHeader}>
          <Text style={[styles.colHeader, { width: 24, textAlign: 'center' }]}>#</Text>
          <Text style={[styles.colHeader, { flex: 1, paddingHorizontal: 4 }]}>Item</Text>
          <Text style={[styles.colHeader, { width: 55, textAlign: 'right' }]}>Price</Text>
          <Text style={[styles.colHeader, { width: 32, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.colHeader, { width: 30, textAlign: 'center' }]}>Day</Text>
          <Text style={[styles.colHeader, { width: 65, textAlign: 'right' }]}>Amt</Text>
        </View>

        {/* Editable Items */}
        {invoice.line_items.map((item, index) => (
          <View key={item.id}>
            <BillItemRow
              item={item}
              index={index}
              onUpdate={updateItemField}
            />
            {/* Swipe-to-delete hint: long press to remove */}
            <TouchableOpacity
              onLongPress={() => {
                Alert.alert(
                  'Remove Item',
                  `Remove "${item.description || 'this item'}"?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => removeItem(item.id),
                    },
                  ],
                );
              }}
              style={styles.deleteHint}
              activeOpacity={1}
            >
              <Text style={styles.deleteHintText}>hold to remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Item Button */}
        <TouchableOpacity style={styles.addItemButton} onPress={addItem} activeOpacity={0.7}>
          <Text style={styles.addItemText}>+ Add Item</Text>
        </TouchableOpacity>

        {/* Summary */}
        <BillSummary invoice={invoice} />

        {/* Generate Buttons */}
        <View style={styles.generateButtons}>
          <TouchableOpacity
            style={styles.xlsxButton}
            onPress={handleGenerateXLSX}
            activeOpacity={0.8}
          >
            <Text style={styles.generateButtonText}>📊 Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={handleGeneratePDF}
            activeOpacity={0.8}
          >
            <Text style={styles.generateButtonText}>📄 PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        {chatMessages.length > 0 && (
          <View style={styles.chatSection}>
            <Text style={styles.chatTitle}>Edit History</Text>
            {chatMessages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Chat Input — AI edits */}
      <ChatInput onSend={handleNLEdit} isLoading={isEditing} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  headerDetail: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  venueBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  metaLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  metaSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 1,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginBottom: 2,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  deleteHint: {
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingBottom: 2,
  },
  deleteHintText: {
    fontSize: 9,
    color: '#d1d5db',
  },
  addItemButton: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  generateButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  xlsxButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  pdfButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  chatSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  goBack: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  goBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

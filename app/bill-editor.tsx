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
import { v4 as uuid } from 'uuid';
import { useBillStore } from '../store/billStore';
import { editBillWithNL } from '../lib/ai/edit-bill';
import { validateAndFixBill } from '../lib/validation/validate-bill';
import { generatePDF } from '../services/pdf';
import { BillItemRow } from '../components/BillItemRow';
import { BillSummary } from '../components/BillSummary';
import { ChatInput } from '../components/ChatInput';
import { ChatBubble } from '../components/ChatBubble';
import { BUSINESS } from '../constants/business';
import { formatINR } from '../utils/formatters';
import type { ChatMessage } from '../types/bill';

export default function BillEditorScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
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

  const handleNLEdit = async (instruction: string) => {
    const userMsg: ChatMessage = {
      id: uuid(),
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
        id: uuid(),
        role: 'assistant',
        text: fixedUpdated.notes || 'Done! Invoice updated.',
        timestamp: Date.now(),
      };
      addChatMessage(assistantMsg);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to apply edit.';
      const errorMsg: ChatMessage = {
        id: uuid(),
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
      const uri = await generatePDF(invoice);
      setPdfUri(uri);
      router.push('/pdf-preview');
    } catch (err) {
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
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
          <Text style={styles.businessName}>{BUSINESS.name}</Text>
          <Text style={styles.headerDetail}>
            GSTIN: {BUSINESS.gstin}
          </Text>
        </View>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Customer</Text>
            <Text style={styles.metaValue}>{invoice.customer_name}</Text>
            <Text style={styles.metaSub}>{invoice.customer_address}</Text>
          </View>
          <View style={[styles.metaBox, styles.metaRight]}>
            <Text style={styles.metaLabel}>Invoice #</Text>
            <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
            <Text style={styles.metaSub}>{invoice.event_date}</Text>
          </View>
        </View>

        {/* Venue */}
        <View style={styles.venueBox}>
          <Text style={styles.metaLabel}>Venue</Text>
          <Text style={styles.metaValue}>{invoice.venue_name}</Text>
          <Text style={styles.metaSub}>{invoice.project_name}</Text>
        </View>

        {/* Items Header */}
        <View style={styles.itemsHeader}>
          <Text style={[styles.colHeader, { width: 24, textAlign: 'center' }]}>#</Text>
          <Text style={[styles.colHeader, { flex: 1, paddingHorizontal: 6 }]}>Item</Text>
          <Text style={[styles.colHeader, { width: 60, textAlign: 'right' }]}>Price</Text>
          <Text style={[styles.colHeader, { width: 30, textAlign: 'center' }]}>Qty</Text>
          <Text style={[styles.colHeader, { width: 30, textAlign: 'center' }]}>Day</Text>
          <Text style={[styles.colHeader, { width: 70, textAlign: 'right' }]}>Amount</Text>
        </View>

        {/* Items */}
        {invoice.line_items.map((item, index) => (
          <BillItemRow key={item.id} item={item} index={index} />
        ))}

        {/* Summary */}
        <BillSummary invoice={invoice} />

        {/* Generate PDF Button */}
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={handleGeneratePDF}
          activeOpacity={0.8}
        >
          <Text style={styles.pdfButtonText}>📄 Generate Invoice PDF</Text>
        </TouchableOpacity>

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

      {/* Chat Input */}
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
  pdfButton: {
    backgroundColor: '#059669',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 18,
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

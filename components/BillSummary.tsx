import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Invoice } from '../types/bill';
import { formatINR, numberToWords, capitalize } from '../utils/formatters';

interface Props {
  invoice: Invoice;
}

export function BillSummary({ invoice }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.value}>{formatINR(invoice.subtotal)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Amount Paid</Text>
        <Text style={styles.value}>{formatINR(invoice.amount_paid)}</Text>
      </View>

      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total Due</Text>
        <Text style={styles.totalValue}>{formatINR(invoice.total_due)}</Text>
      </View>

      <Text style={styles.words}>
        {capitalize(numberToWords(invoice.subtotal))} rupees only
      </Text>

      {invoice.needs_review && (
        <View style={styles.reviewBanner}>
          <Text style={styles.reviewText}>
            Needs review — some data may be inaccurate
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 15,
    color: '#6b7280',
  },
  value: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#d1d5db',
    marginTop: 4,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  words: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
  },
  reviewBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  reviewText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
  },
});

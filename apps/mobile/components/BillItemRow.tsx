import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BillLineItem } from '../types/bill';
import { formatINR } from '../utils/formatters';

interface Props {
  item: BillLineItem;
  index: number;
}

export function BillItemRow({ item, index }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.num}>{index + 1}</Text>
      <Text style={styles.desc} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.price}>{formatINR(item.unit_price)}</Text>
      <Text style={styles.qty}>{item.units}</Text>
      <Text style={styles.days}>{item.days}</Text>
      <Text style={styles.amount}>{formatINR(item.amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  num: {
    width: 24,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  desc: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingHorizontal: 6,
  },
  price: {
    width: 60,
    fontSize: 13,
    color: '#374151',
    textAlign: 'right',
  },
  qty: {
    width: 30,
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
  },
  days: {
    width: 30,
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
  },
  amount: {
    width: 70,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
});

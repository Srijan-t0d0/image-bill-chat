import { View, StyleSheet } from 'react-native';
import { EditableField } from './EditableField';
import type { BillLineItem } from '../types/bill';

interface Props {
  item: BillLineItem;
  index: number;
  onUpdate: (id: string, field: keyof BillLineItem, value: string | number) => void;
}

export function BillItemRow({ item, index, onUpdate }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.num}>
        <EditableField
          value={String(index + 1)}
          onSave={() => {}}
          style={styles.numText}
        />
      </View>
      <View style={styles.desc}>
        <EditableField
          value={item.description}
          onSave={(v) => onUpdate(item.id, 'description', v)}
          style={styles.descText}
          placeholder="Item name"
        />
      </View>
      <View style={styles.price}>
        <EditableField
          value={String(item.unit_price)}
          onSave={(v) => onUpdate(item.id, 'unit_price', Number(v) || 0)}
          style={styles.priceText}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.qty}>
        <EditableField
          value={String(item.units)}
          onSave={(v) => onUpdate(item.id, 'units', Number(v) || 0)}
          style={styles.qtyText}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.days}>
        <EditableField
          value={String(item.days)}
          onSave={(v) => onUpdate(item.id, 'days', Number(v) || 1)}
          style={styles.daysText}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.amount}>
        <EditableField
          value={String(item.amount)}
          onSave={() => {}} // calculated, not directly editable
          style={styles.amountText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  num: { width: 24 },
  numText: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  desc: { flex: 1, paddingHorizontal: 4 },
  descText: { fontSize: 14, color: '#1f2937' },
  price: { width: 55 },
  priceText: { fontSize: 13, color: '#374151', textAlign: 'right' },
  qty: { width: 32 },
  qtyText: { fontSize: 13, color: '#374151', textAlign: 'center' },
  days: { width: 30 },
  daysText: { fontSize: 13, color: '#374151', textAlign: 'center' },
  amount: { width: 65 },
  amountText: { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'right' },
});

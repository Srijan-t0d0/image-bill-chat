import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useBillStore } from '../store/billStore';

export default function FilePreviewScreen() {
  const router = useRouter();
  const { pdfUri } = useBillStore();

  const isXlsx = pdfUri?.endsWith('.xlsx');
  const fileType = isXlsx ? 'Excel' : 'PDF';
  const icon = isXlsx ? '📊' : '📄';
  const mimeType = isXlsx
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/pdf';

  const handleShare = async () => {
    if (!pdfUri) {
      Alert.alert('Error', 'No file to share.');
      return;
    }
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(pdfUri, {
        mimeType,
        dialogTitle: `Share Invoice ${fileType}`,
      });
    } catch {
      Alert.alert('Error', 'Failed to share file.');
    }
  };

  if (!pdfUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No file generated yet.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>Invoice {fileType} Ready!</Text>
        <Text style={styles.subtitle}>
          {isXlsx
            ? 'Your Excel invoice has formulas for GST and totals. Open in Google Sheets to verify the math.'
            : 'Your invoice has been generated. Share it via WhatsApp, email, or save it to your device.'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Text style={styles.shareText}>📤 Share Invoice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryText}>✏️ Back to Editor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newScanButton}
          onPress={() => {
            useBillStore.getState().reset();
            router.replace('/');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.newScanText}>📸 Scan New Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    padding: 32,
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#065f46',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#059669',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  shareText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  newScanButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  newScanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'center',
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

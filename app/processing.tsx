import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBillStore } from '../store/billStore';
import { extractBillFromImage } from '../lib/ai/extract-bill';
import { validateAndFixBill } from '../lib/validation/validate-bill';

export default function ProcessingScreen() {
  const router = useRouter();
  const {
    imageUri,
    imageBase64,
    setInvoice,
    isExtracting,
    setExtracting,
    error,
    setError,
  } = useBillStore();

  const hasStarted = useRef(false);

  const runExtraction = async () => {
    if (!imageBase64) {
      setError('No image found. Please go back and try again.');
      return;
    }

    setExtracting(true);
    setError(null);

    try {
      const rawInvoice = await extractBillFromImage(imageBase64);
      const fixedInvoice = validateAndFixBill(rawInvoice);
      setInvoice(fixedInvoice);
      router.replace('/bill-editor');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to read the bill. Please try again.';
      setError(message);
    } finally {
      setExtracting(false);
    }
  };

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      runExtraction();
    }
  }, []);

  return (
    <View style={styles.container}>
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      )}

      {isExtracting && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Reading your bill...</Text>
          <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              hasStarted.current = false;
              runExtraction();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  preview: {
    width: 200,
    height: 260,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#f3f4f6',
  },
  loadingBox: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  errorBox: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  backText: {
    color: '#6b7280',
    fontSize: 15,
  },
});

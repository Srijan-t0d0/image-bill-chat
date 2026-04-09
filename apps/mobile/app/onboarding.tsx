import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../store/profileStore';
import type { BusinessProfile } from '../constants/business';
import { EMPTY_BUSINESS_PROFILE } from '../constants/business';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setProfile } = useProfileStore();
  const [form, setForm] = useState<BusinessProfile>(EMPTY_BUSINESS_PROFILE);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateBankField = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      bank: { ...prev.bank, [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter your business name.');
      return;
    }

    const profile: BusinessProfile = {
      ...form,
      services: form.services.length > 0
        ? form.services
        : form.name ? ['General Services'] : [],
    };

    await setProfile(profile);
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Business Setup</Text>
        <Text style={styles.subtitle}>
          Enter your business details. These will appear on your invoices.
          All data is stored only on this device.
        </Text>

        <Text style={styles.sectionTitle}>Business Details</Text>

        <Field
          label="Business Name *"
          value={form.name}
          onChangeText={(v) => updateField('name', v)}
          placeholder="Your business name"
        />
        <Field
          label="Address"
          value={form.address}
          onChangeText={(v) => updateField('address', v)}
          placeholder="Full address with PIN code"
        />
        <Field
          label="Phone"
          value={form.phone}
          onChangeText={(v) => updateField('phone', v)}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
        <Field
          label="Email"
          value={form.email}
          onChangeText={(v) => updateField('email', v)}
          placeholder="Email address"
          keyboardType="email-address"
        />
        <Field
          label="PAN"
          value={form.pan}
          onChangeText={(v) => updateField('pan', v.toUpperCase())}
          placeholder="PAN number"
          autoCapitalize="characters"
        />
        <Field
          label="GSTIN"
          value={form.gstin}
          onChangeText={(v) => updateField('gstin', v.toUpperCase())}
          placeholder="GSTIN number"
          autoCapitalize="characters"
        />
        <Field
          label="UDYAM Registration"
          value={form.udyam}
          onChangeText={(v) => updateField('udyam', v.toUpperCase())}
          placeholder="UDYAM number (optional)"
          autoCapitalize="characters"
        />
        <Field
          label="Services (comma separated)"
          value={form.services.join(', ')}
          onChangeText={(v) =>
            setForm((prev) => ({
              ...prev,
              services: v.split(',').map((s) => s.trim()).filter(Boolean),
            }))
          }
          placeholder="e.g. PA System, Stage Lighting"
        />

        <Text style={styles.sectionTitle}>Bank Details</Text>

        <Field
          label="Account Holder Name"
          value={form.bank.holder}
          onChangeText={(v) => updateBankField('holder', v)}
          placeholder="Name as on bank account"
        />
        <Field
          label="Bank Name"
          value={form.bank.bank_name}
          onChangeText={(v) => updateBankField('bank_name', v)}
          placeholder="Bank name"
        />
        <Field
          label="Account Number"
          value={form.bank.account}
          onChangeText={(v) => updateBankField('account', v)}
          placeholder="Account number"
          keyboardType="numeric"
        />
        <Field
          label="IFSC Code"
          value={form.bank.ifsc}
          onChangeText={(v) => updateBankField('ifsc', v.toUpperCase())}
          placeholder="IFSC code"
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveText}>Save & Continue</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  fieldContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

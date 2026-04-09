import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { businessProfileSchema } from '@image-bill-chat/shared';
import type { BusinessProfile } from '../constants/business';
import { EMPTY_BUSINESS_PROFILE } from '../constants/business';
import { useProfileStore } from '../store/profileStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setProfile } = useProfileStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<BusinessProfile>({
    defaultValues: EMPTY_BUSINESS_PROFILE,
  });

  const onSubmit = async (data: BusinessProfile) => {
    // Validate with Zod
    const result = businessProfileSchema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') as keyof BusinessProfile;
        setError(path, { message: issue.message });
      }
      return;
    }

    const profile = result.data;
    if (profile.services.length === 0 && profile.name) {
      profile.services = ['General Services'];
    }
    // Uppercase PAN/GSTIN/UDYAM/IFSC
    profile.pan = profile.pan.toUpperCase();
    profile.gstin = profile.gstin.toUpperCase();
    profile.udyam = profile.udyam.toUpperCase();
    profile.bank.ifsc = profile.bank.ifsc.toUpperCase();

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
          Enter your business details. These appear on your invoices.{'\n'}
          All data is stored only on this device.
        </Text>

        <Text style={styles.sectionTitle}>Business Details</Text>

        <Field
          name="name"
          label="Business Name *"
          placeholder="Your business name"
          control={control}
          error={errors.name?.message}
        />
        <Field
          name="address"
          label="Address"
          placeholder="Full address with PIN code"
          control={control}
          error={errors.address?.message}
        />
        <Field
          name="phone"
          label="Phone"
          placeholder="Phone number"
          control={control}
          keyboardType="phone-pad"
        />
        <Field
          name="email"
          label="Email"
          placeholder="Email address"
          control={control}
          keyboardType="email-address"
          error={errors.email?.message}
        />
        <Field
          name="pan"
          label="PAN"
          placeholder="PAN number"
          control={control}
          autoCapitalize="characters"
        />
        <Field
          name="gstin"
          label="GSTIN"
          placeholder="GSTIN number"
          control={control}
          autoCapitalize="characters"
        />
        <Field
          name="udyam"
          label="UDYAM Registration"
          placeholder="UDYAM number (optional)"
          control={control}
          autoCapitalize="characters"
        />

        <Controller
          name="services"
          control={control}
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Services (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={value.join(', ')}
                onChangeText={(v) =>
                  onChange(
                    v
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="e.g. PA System, Stage Lighting"
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}
        />

        <Text style={styles.sectionTitle}>Bank Details</Text>

        <Field
          name="bank.holder"
          label="Account Holder Name"
          placeholder="Name as on bank account"
          control={control}
        />
        <Field
          name="bank.bank_name"
          label="Bank Name"
          placeholder="Bank name"
          control={control}
        />
        <Field
          name="bank.account"
          label="Account Number"
          placeholder="Account number"
          control={control}
          keyboardType="numeric"
        />
        <Field
          name="bank.ifsc"
          label="IFSC Code"
          placeholder="IFSC code"
          control={control}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          <Text style={styles.saveText}>
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  name,
  label,
  placeholder,
  control,
  error,
  keyboardType,
  autoCapitalize,
}: {
  name: string;
  label: string;
  placeholder: string;
  control: any;
  error?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            keyboardType={keyboardType || 'default'}
            autoCapitalize={autoCapitalize || 'sentences'}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      )}
    />
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

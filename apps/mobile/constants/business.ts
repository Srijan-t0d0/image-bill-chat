import type { BusinessProfileSchema } from '@image-bill-chat/shared';

export type BusinessProfile = BusinessProfileSchema;

export const EMPTY_BUSINESS_PROFILE: BusinessProfile = {
  name: '',
  address: '',
  phone: '',
  email: '',
  pan: '',
  gstin: '',
  udyam: '',
  services: [],
  bank: {
    holder: '',
    bank_name: '',
    ifsc: '',
    account: '',
  },
};

export const TAX_RATE = 18; // GST 18%

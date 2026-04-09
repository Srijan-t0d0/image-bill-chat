/**
 * Business profile structure — filled by user during onboarding.
 * No PII is stored in source code. All data lives in AsyncStorage on-device.
 */
export interface BusinessProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  pan: string;
  gstin: string;
  udyam: string;
  services: string[];
  bank: {
    holder: string;
    bank_name: string;
    ifsc: string;
    account: string;
  };
}

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

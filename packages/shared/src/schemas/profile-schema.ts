import { z } from 'zod';

export const bankDetailsSchema = z.object({
  holder: z.string(),
  bank_name: z.string(),
  ifsc: z.string(),
  account: z.string(),
});

export const businessProfileSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  pan: z.string(),
  gstin: z.string(),
  udyam: z.string(),
  services: z.array(z.string()),
  bank: bankDetailsSchema,
});

export type BusinessProfileSchema = z.infer<typeof businessProfileSchema>;

import type { Invoice } from '../../types/bill';
import { api } from '../api/client';

export async function extractBillFromImage(
  base64Image: string,
): Promise<Invoice> {
  return api.extractBill(base64Image);
}

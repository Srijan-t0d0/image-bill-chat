import type { Invoice } from '../../types/bill';
import { api } from '../api/client';

export async function editBillWithNL(
  currentBill: Invoice,
  instruction: string,
): Promise<Invoice> {
  return api.editBill(currentBill, instruction);
}

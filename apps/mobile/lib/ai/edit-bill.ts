import { generateText, Output } from 'ai';
import { billModel } from './model';
import { invoiceSchema } from '../schemas/bill-schema';
import { EDIT_SYSTEM_PROMPT } from '../../constants/prompts';
import type { Invoice } from '../../types/bill';

export async function editBillWithNL(
  currentBill: Invoice,
  instruction: string,
): Promise<Invoice> {
  const { output } = await generateText({
    model: billModel,
    system: EDIT_SYSTEM_PROMPT,
    prompt: `Current invoice JSON:\n${JSON.stringify(currentBill, null, 2)}\n\nUser instruction: "${instruction}"\n\nApply the instruction and return the complete updated invoice.`,
    output: Output.object({ schema: invoiceSchema }),
  });

  if (!output) {
    throw new Error('Failed to apply the edit. Please try again.');
  }

  return output as Invoice;
}

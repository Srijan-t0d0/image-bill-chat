import { generateText, Output } from 'ai';
import { billModel } from './model';
import { invoiceSchema } from '../schemas/bill-schema';
import { OCR_SYSTEM_PROMPT } from '../../constants/prompts';
import type { Invoice } from '../../types/bill';

export async function extractBillFromImage(
  base64Image: string,
): Promise<Invoice> {
  const { output } = await generateText({
    model: billModel,
    system: OCR_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all data from this bill/invoice image.',
          },
          {
            type: 'image',
            image: base64Image,
          },
        ],
      },
    ],
    output: Output.object({ schema: invoiceSchema }),
  });

  if (!output) {
    throw new Error('Failed to extract bill data from image.');
  }

  // Check if the model flagged it as not a bill
  if (output.customer_name === 'NOT_A_BILL') {
    throw new Error(
      'The image does not appear to contain a bill or invoice. Please try again with a clearer photo.',
    );
  }

  if (output.confidence_score < 0.4) {
    throw new Error(
      'Image quality is too poor for reliable extraction. Please retake the photo with better lighting.',
    );
  }

  return output as Invoice;
}

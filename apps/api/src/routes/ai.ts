import { Hono } from 'hono';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { invoiceSchema, OCR_SYSTEM_PROMPT, EDIT_SYSTEM_PROMPT } from '@image-bill-chat/shared';
import type { Env } from '../index';

const aiRoutes = new Hono<Env>();

// POST /api/ai/extract — OCR: image → structured Invoice
aiRoutes.post('/extract', async (c) => {
  const { image } = await c.req.json<{ image: string }>();

  if (!image) {
    return c.json({ error: 'image (base64) is required' }, 400);
  }

  const google = createGoogleGenerativeAI({
    apiKey: c.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const { output } = await generateText({
    model: google('gemini-2.5-flash'),
    system: OCR_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract all data from this bill/invoice image.' },
          { type: 'image', image },
        ],
      },
    ],
    output: Output.object({ schema: invoiceSchema }),
  });

  if (!output) {
    return c.json({ error: 'Failed to extract bill data from image.' }, 500);
  }

  if (output.customer_name === 'NOT_A_BILL') {
    return c.json(
      { error: 'The image does not appear to contain a bill or invoice.' },
      422,
    );
  }

  if (output.confidence_score < 0.4) {
    return c.json(
      { error: 'Image quality too poor. Please retake with better lighting.', invoice: output },
      422,
    );
  }

  return c.json(output);
});

// POST /api/ai/edit — NL edit: instruction + current invoice → updated Invoice
aiRoutes.post('/edit', async (c) => {
  const { invoice, instruction } = await c.req.json<{
    invoice: unknown;
    instruction: string;
  }>();

  if (!invoice || !instruction) {
    return c.json({ error: 'invoice and instruction are required' }, 400);
  }

  const google = createGoogleGenerativeAI({
    apiKey: c.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const { output } = await generateText({
    model: google('gemini-2.5-flash'),
    system: EDIT_SYSTEM_PROMPT,
    prompt: `Current invoice JSON:\n${JSON.stringify(invoice, null, 2)}\n\nUser instruction: "${instruction}"\n\nApply the instruction and return the complete updated invoice.`,
    output: Output.object({ schema: invoiceSchema }),
  });

  if (!output) {
    return c.json({ error: 'Failed to apply the edit.' }, 500);
  }

  return c.json(output);
});

export { aiRoutes };

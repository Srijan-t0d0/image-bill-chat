import { google } from '@ai-sdk/google';

// ============================================================
// Single place to swap AI providers.
// Change the import and model string to switch providers:
//
//   import { openai } from '@ai-sdk/openai';
//   export const billModel = openai('gpt-4o');
//
//   import { anthropic } from '@ai-sdk/anthropic';
//   export const billModel = anthropic('claude-sonnet-4-5');
// ============================================================

export const billModel = google('gemini-2.5-flash');

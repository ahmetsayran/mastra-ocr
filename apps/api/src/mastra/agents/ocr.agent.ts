import { Agent } from '@mastra/core/agent';

// Free OpenRouter model with image input; key is read from OPENROUTER_API_KEY
export const OCR_MODEL = 'openrouter/google/gemma-4-31b-it:free';

export const ocrAgent = new Agent({
  id: 'ocr-agent',
  name: 'OCR Agent',
  description: 'Reads text from document images',
  instructions:
    'You read document images. Return the text exactly as it appears in the image, keeping the original language and line order. Do not add comments or explanations.',
  model: OCR_MODEL,
});

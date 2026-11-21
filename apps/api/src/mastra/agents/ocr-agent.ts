import { Agent } from '@mastra/core/agent';

export const ocrAgent = new Agent({
  id: 'ocr-agent',
  name: 'OCR Agent',
  instructions: 'You read documents and images and answer accurately based only on their content.',
  model: 'openrouter/nvidia/nemotron-3.5-super-vl:free',
});

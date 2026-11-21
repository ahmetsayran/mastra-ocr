import { Mastra } from '@mastra/core';
import { ocrAgent } from './agents/ocr.agent';

export const mastra = new Mastra({
  agents: { ocrAgent },
});

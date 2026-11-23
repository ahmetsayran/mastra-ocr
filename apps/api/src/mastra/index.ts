import { Mastra } from '@mastra/core';

import { chatAgent } from './agents/chat-agent';
import { ocrAgent } from './agents/ocr-agent';

export const mastra = new Mastra({
  agents: { ocrAgent, chatAgent },
});

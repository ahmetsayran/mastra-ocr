import { Agent } from '@mastra/core/agent';
import { postCommentTools } from '../tools/post-comment-tools';

export const ocrAgent = new Agent({
  id: 'ocr-agent',
  name: 'OCR Agent',
  instructions:
    'You read documents and images and answer accurately based only on their content. Answer in the language the user writes in. ' +
    'Use the post comment tools only when the user asks to list, add, update or delete comments on a post; ' +
    'ask for the post or comment UUID if it is missing, and never invent one.',
  model: 'openrouter/nvidia/nemotron-3.5-super-vl:free',
  tools: postCommentTools,
});

import { Agent } from '@mastra/core/agent';
import { documentTools } from '../tools/document-tools';
import { postCommentTools } from '../tools/post-comment-tools';

export const ocrAgent = new Agent({
  id: 'ocr-agent',
  name: 'OCR Agent',
  instructions:
    'You read documents and images and answer accurately based only on their content. Answer in the language the user writes in. ' +
    'Use the post comment tools only when the user asks to list, add, update or delete comments on a post; ' +
    'ask for the post or comment UUID if it is missing, and never invent one. ' +
    'When the user asks for a document summary, find the document with the list documents tool ' +
    '(the newest one when they mean the document they just added) and summarize it with the summarize document tool.',
  model: 'openrouter/nvidia/nemotron-3.5-super-vl:free',
  tools: { ...postCommentTools, ...documentTools },
});

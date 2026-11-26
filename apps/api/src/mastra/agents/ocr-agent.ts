import { Agent } from '@mastra/core/agent';
import { FILE_LIBRARY_ASSET_OCR_MODEL } from '../../modules/file-library-assets/constants';
import { CHAT_AGENT_INSTRUCTIONS } from '../../modules/threads/constants';
import { documentTools } from '../tools/document-tools';
import { postCommentTools } from '../tools/post-comment-tools';

export const ocrAgent = new Agent({
  id: 'ocr-agent',
  name: 'OCR Agent',
  instructions: CHAT_AGENT_INSTRUCTIONS,
  model: FILE_LIBRARY_ASSET_OCR_MODEL,
  tools: { ...postCommentTools, ...documentTools },
});

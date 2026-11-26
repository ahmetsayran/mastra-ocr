// Instructions of the agent that answers chat messages and reads documents
export const CHAT_AGENT_INSTRUCTIONS =
  'You read documents and images and answer accurately based only on their content. Answer in the language the user writes in. ' +
  'Use the post comment tools only when the user asks to list, add, update or delete comments on a post; ' +
  'ask for the post or comment UUID if it is missing, and never invent one. ' +
  'Documents added to this chat appear in the conversation as "[Sohbete belge eklendi: name (uuid: ...)]"; ' +
  'when the user refers to "this document" or the document they added, use that uuid. ' +
  'When the user asks for a document summary, use the summarize document tool with that uuid; ' +
  'if no document was added to this chat, find it with the list documents tool (the newest one when they mean the document they just added).';

// How a document attached to the chat appears in the conversation sent to the agent
export const CHAT_ATTACHMENT_NOTE = (name: string, uuid: string) =>
  `[Sohbete belge eklendi: ${name} (uuid: ${uuid})]`;

// Heading of the document parts found by chat search
export const CHAT_DOCUMENT_CONTEXT_PROMPT = 'Belgelerden ilgili bölümler:';

// Number of earlier messages sent to the agent so it remembers the conversation
export const CHAT_HISTORY_LIMIT = 20;

// Input guardrail rules: chat messages matching these are blocked before reaching the agent
export const CHAT_PROMPT_INJECTION_RULES = [
  {
    name: 'ignore-instructions',
    pattern: /ignore (all |the )?(previous|above|prior) instructions/i,
  },
  {
    name: 'talimatlari-yok-say',
    pattern: /(önceki|yukarıdaki) (tüm )?talimatları (yok say|unut|görmezden gel)/i,
  },
  {
    name: 'reveal-system-prompt',
    pattern: /(system prompt|sistem talimat)/i,
  },
];

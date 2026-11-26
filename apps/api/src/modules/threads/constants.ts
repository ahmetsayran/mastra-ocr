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

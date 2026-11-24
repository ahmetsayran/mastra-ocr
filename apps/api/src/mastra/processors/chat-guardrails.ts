import { RegexFilterProcessor, UnicodeNormalizer } from '@mastra/core/processors';

const PROMPT_INJECTION_RULES = [
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

export const chatInputProcessors = [
  new UnicodeNormalizer(),
  new RegexFilterProcessor({
    phase: 'input',
    strategy: 'block',
    presets: ['secrets'],
    rules: PROMPT_INJECTION_RULES,
  }),
];

export const chatOutputProcessors = [
  new RegexFilterProcessor({
    phase: 'output',
    strategy: 'redact',
    presets: ['secrets'],
  }),
];

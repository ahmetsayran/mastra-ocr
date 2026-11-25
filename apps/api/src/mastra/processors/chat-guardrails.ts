import { RegexFilterProcessor, UnicodeNormalizer } from '@mastra/core/processors';
import { CHAT_PROMPT_INJECTION_RULES } from '../../modules/threads/constants';

export const chatInputProcessors = [
  new UnicodeNormalizer(),
  new RegexFilterProcessor({
    phase: 'input',
    strategy: 'block',
    presets: ['secrets'],
    rules: CHAT_PROMPT_INJECTION_RULES,
  }),
];

export const chatOutputProcessors = [
  new RegexFilterProcessor({
    phase: 'output',
    strategy: 'redact',
    presets: ['secrets'],
  }),
];

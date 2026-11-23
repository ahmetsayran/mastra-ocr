import { Agent } from '@mastra/core/agent';

export const chatAgent = new Agent({
  id: 'chat-agent',
  name: 'Chat Agent',
  instructions: 'You are a helpful assistant. Answer in the language the user writes in.',
  model: 'openrouter/nvidia/nemotron-3.5-super-vl:free',
});

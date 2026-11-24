import { ModelRouterEmbeddingModel } from '@mastra/core/llm';

export const documentEmbedder = new ModelRouterEmbeddingModel({
  providerId: 'openrouter',
  modelId: 'nvidia/nemotron-3.5-embed-1b:free',
  url: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

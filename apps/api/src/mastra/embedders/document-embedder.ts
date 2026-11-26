import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { FILE_LIBRARY_ASSET_RAG_EMBED_MODEL } from '../../modules/file-library-assets/constants';

export const documentEmbedder = new ModelRouterEmbeddingModel({
  providerId: 'openrouter',
  modelId: FILE_LIBRARY_ASSET_RAG_EMBED_MODEL,
  url: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

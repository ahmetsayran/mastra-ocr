import { FileLibraryAssetType } from '@onlyjs/db/client';
import { HttpError, type Middleware } from '../../utils';
import { RagService } from './services/rag.service';

export function withDocumentIndexing(): Middleware {
  return {
    afterHandle: ({ response }) => {
      if (response instanceof HttpError) return;

      if (response?.type === FileLibraryAssetType.OCR_DOCUMENT) {
        RagService.indexInBackground(response.uuid);
      }
    },
  };
}

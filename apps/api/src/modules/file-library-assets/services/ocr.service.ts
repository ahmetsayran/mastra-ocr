import fs from 'fs';
import { FileLibraryAssetType } from '@onlyjs/db/client';
import { getStoragePath } from '../../../core';
import { mastra } from '../../../mastra';
import { UnprocessableEntityException } from '../../../utils';
import { FileLibraryAssetFormatter } from '../formatters';
import { FileLibraryAssetsService } from '../service';

const READ_PROMPT = 'Bu görseldeki tüm metni oku ve aynen yaz.';

export abstract class OcrService {
  static async read(uuid: string) {
    const asset = await FileLibraryAssetsService.show(uuid);
    if (asset.type !== FileLibraryAssetType.OCR_DOCUMENT) {
      throw new UnprocessableEntityException('Bu dosya bir OCR belgesi değil');
    }

    const image = await fs.promises.readFile(getStoragePath(asset.path));
    const mimeType = asset.mimeType.replace('_', '/').toLowerCase();

    const agent = mastra.getAgent('ocrAgent');
    const result = await agent.generate([
      {
        role: 'user',
        content: [
          { type: 'text', text: READ_PROMPT },
          { type: 'image', image, mimeType },
        ],
      },
    ]);

    const updatedAsset = await FileLibraryAssetsService.update(uuid, {
      metadata: { text: result.text },
    });

    return FileLibraryAssetFormatter.response(updatedAsset);
  }
}

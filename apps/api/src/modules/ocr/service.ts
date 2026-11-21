import { FileLibraryAssetType } from '@onlyjs/db/client';
import { getStoragePath } from '../../core';
import { mastra } from '../../mastra';
import { UnprocessableEntityException } from '../../utils';
import { FileLibraryAssetsService } from '../file-library-assets';

const READ_PROMPT = 'Bu görseldeki tüm metni oku ve aynen yaz.';

export abstract class OcrService {
  static async read(uuid: string) {
    const asset = await FileLibraryAssetsService.show(uuid);
    if (asset.type !== FileLibraryAssetType.OCR_DOCUMENT) {
      throw new UnprocessableEntityException('Bu dosya bir OCR belgesi değil');
    }

    const file = Bun.file(getStoragePath(asset.path));
    const image = new Uint8Array(await file.arrayBuffer());

    const agent = mastra.getAgent('ocrAgent');
    const result = await agent.generate([
      {
        role: 'user',
        content: [
          { type: 'text', text: READ_PROMPT },
          { type: 'image', image, mimeType: file.type },
        ],
      },
    ]);

    await FileLibraryAssetsService.update(uuid, { metadata: { text: result.text } });

    return { uuid, text: result.text };
  }
}

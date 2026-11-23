import fs from 'fs';
import { FileLibraryAssetType } from '@onlyjs/db/client';
import { getStoragePath } from '../../../core';
import { mastra } from '../../../mastra';
import { UnprocessableEntityException } from '../../../utils';
import { FILE_LIBRARY_ASSET_OCR_INVOICE_SCHEMA } from '../constants';
import { FileLibraryAssetFormatter } from '../formatters';
import { FileLibraryAssetsService } from '../service';

const READ_PROMPT = 'Bu görseldeki tüm metni oku ve aynen yaz.';

const EXTRACT_PROMPT =
  'Bu faturadaki bilgileri ayıkla. Tutarları noktasız ve virgülsüz düz sayı olarak yaz (örnek: "1.440,00 TL" → 1440). ' +
  'Belgede "Toplam", "Genel Toplam" veya "Ödenecek Tutar" yazan tutar genel toplamdır. ' +
  'Ara toplamı sadece belgede ayrıca "Ara Toplam" ya da KDV hariç tutar olarak yazıyorsa doldur. ' +
  'Tarihi YYYY-MM-DD biçiminde yaz. Para birimini kod olarak yaz (TL → TRY). ' +
  'Belgede gerçekten olmayan bilgi için null yaz.';

export abstract class OcrService {
  private static async loadDocument(uuid: string) {
    const asset = await FileLibraryAssetsService.show(uuid);
    if (asset.type !== FileLibraryAssetType.OCR_DOCUMENT) {
      throw new UnprocessableEntityException('Bu dosya bir OCR belgesi değil');
    }

    const image = await fs.promises.readFile(getStoragePath(asset.path));
    const mimeType = asset.mimeType.replace('_', '/').toLowerCase();
    const metadata = (asset.metadata ?? {}) as Record<string, unknown>;

    return { image, mimeType, metadata };
  }

  static async read(uuid: string) {
    const { image, mimeType, metadata } = await this.loadDocument(uuid);

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
      metadata: { ...metadata, text: result.text },
    });

    return FileLibraryAssetFormatter.response(updatedAsset);
  }

  static async extract(uuid: string) {
    const { image, mimeType, metadata } = await this.loadDocument(uuid);

    const agent = mastra.getAgent('ocrAgent');
    const result = await agent.generate(
      [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACT_PROMPT },
            { type: 'image', image, mimeType },
          ],
        },
      ],
      {
        structuredOutput: {
          schema: FILE_LIBRARY_ASSET_OCR_INVOICE_SCHEMA,
          jsonPromptInjection: 'auto',
        },
      },
    );

    const updatedAsset = await FileLibraryAssetsService.update(uuid, {
      metadata: { ...metadata, invoice: result.object },
    });

    return FileLibraryAssetFormatter.response(updatedAsset);
  }
}

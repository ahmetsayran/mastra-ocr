import fs from 'fs';
import prisma from '@onlyjs/db';
import { FileLibraryAssetType, type Prisma } from '@onlyjs/db/client';
import { getStoragePath } from '../../../core';
import { mastra } from '../../../mastra';
import { NotFoundException, UnprocessableEntityException } from '../../../utils';
import { toAgentHttpError } from '../../../utils/agent-errors';
import { FILE_LIBRARY_ASSET_OCR_INVOICE_SCHEMA } from '../constants';
import { FileLibraryAssetFormatter } from '../formatters';
import { FileLibraryAssetsService } from '../service';

const READ_PROMPT = 'Bu görseldeki tüm metni oku ve aynen yaz.';

const SUMMARY_PROMPT =
  'Bu belgeyi Türkçe olarak 3-5 cümleyle özetle. Belgenin türünü, kimden kime olduğunu ve önemli tutar, tarih ve bilgileri yaz.';

const EXTRACT_PROMPT =
  'Bu faturadaki bilgileri ayıkla. Tutarları noktasız ve virgülsüz düz sayı olarak yaz (örnek: "1.440,00 TL" → 1440). ' +
  'Belgede "Toplam", "Genel Toplam" veya "Ödenecek Tutar" yazan tutar genel toplamdır. ' +
  'Ara toplam KDV hariç tutardır; belgede "Ara Toplam" yazmıyorsa ürün ve hizmet satırlarındaki tutarların toplamını yaz. ' +
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

    return { asset, image, mimeType };
  }

  private static async saveMetadata(uuid: string, data: Record<string, unknown>) {
    // Row lock: background read and extract must not overwrite each other's metadata
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const [asset] = await tx.$queryRaw<{ metadata: Record<string, unknown> | null }[]>`
        SELECT "metadata" FROM "file_library_assets" WHERE "uuid" = ${uuid} FOR UPDATE
      `;
      if (!asset) {
        throw new NotFoundException('Dosya bulunamadı.');
      }
      return FileLibraryAssetsService.update(
        uuid,
        { metadata: { ...asset.metadata, ...data } },
        tx,
      );
    });
  }

  static async read(uuid: string) {
    try {
      const { image, mimeType } = await this.loadDocument(uuid);

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

      const updatedAsset = await this.saveMetadata(uuid, { text: result.text });

      return FileLibraryAssetFormatter.response(updatedAsset);
    } catch (error) {
      throw await toAgentHttpError(
        error,
        'OcrService.read',
        'Yapay zekâ servisi belgeyi işleyemedi, tekrar deneyin',
      );
    }
  }

  static async summarize(uuid: string) {
    try {
      const { asset, image, mimeType } = await this.loadDocument(uuid);

      // A saved summary is reused so the same document is not summarized twice
      const metadata = asset.metadata as { summary?: string } | null;
      if (metadata?.summary) {
        return FileLibraryAssetFormatter.response(asset);
      }

      const agent = mastra.getAgent('ocrAgent');
      const result = await agent.generate([
        {
          role: 'user',
          content: [
            { type: 'text', text: SUMMARY_PROMPT },
            { type: 'image', image, mimeType },
          ],
        },
      ]);

      const updatedAsset = await this.saveMetadata(uuid, { summary: result.text });

      return FileLibraryAssetFormatter.response(updatedAsset);
    } catch (error) {
      throw await toAgentHttpError(
        error,
        'OcrService.summarize',
        'Yapay zekâ servisi belgeyi özetleyemedi, tekrar deneyin',
      );
    }
  }

  static async extract(uuid: string) {
    try {
      const { image, mimeType } = await this.loadDocument(uuid);

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
          modelSettings: { temperature: 0 },
        },
      );

      const updatedAsset = await this.saveMetadata(uuid, { invoice: result.object });

      return FileLibraryAssetFormatter.response(updatedAsset);
    } catch (error) {
      throw await toAgentHttpError(
        error,
        'OcrService.extract',
        'Yapay zekâ servisi belgeyi işleyemedi, tekrar deneyin',
      );
    }
  }
}

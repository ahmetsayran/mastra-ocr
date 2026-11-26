import fs from 'fs';
import prisma from '@onlyjs/db';
import {
  type FileLibraryAsset,
  FileLibraryAssetMimeType,
  FileLibraryAssetType,
  type Prisma,
} from '@onlyjs/db/client';
import type { z } from 'zod';
import { getStoragePath } from '../../../core';
import { mastra } from '../../../mastra';
import {
  NotFoundException,
  splitText,
  toAgentHttpError,
  UnprocessableEntityException,
} from '../../../utils';
import {
  FILE_LIBRARY_ASSET_OCR_CLASSIFY_PROMPT,
  FILE_LIBRARY_ASSET_OCR_CLASSIFY_SCHEMA,
  FILE_LIBRARY_ASSET_OCR_EXTRACTORS,
  FILE_LIBRARY_ASSET_OCR_PART_SUMMARY_PROMPT,
  FILE_LIBRARY_ASSET_OCR_PDF_MAX_PAGES,
  FILE_LIBRARY_ASSET_OCR_PDF_RENDER_SCALE,
  FILE_LIBRARY_ASSET_OCR_READ_PROMPT,
  FILE_LIBRARY_ASSET_OCR_SUMMARY_PROMPT,
  FILE_LIBRARY_ASSET_OCR_TEXT_PART_SIZE,
} from '../constants';
import { FileLibraryAssetFormatter } from '../formatters';
import { FileLibraryAssetsService } from '../service';
import type {
  FileLibraryAssetExtractionUpdateInput,
  FileLibraryAssetOcrDocumentType,
  FileLibraryAssetOcrExtraction,
} from '../types';
import { pdfService } from './pdf.service';
import { ValidationService } from './validation.service';

// A document is read either as text (PDF text layer) or as images (photos, scanned PDF pages)
type OcrDocument =
  | { asset: FileLibraryAsset; text: string }
  | { asset: FileLibraryAsset; images: { image: Buffer; mimeType: string }[] };

export abstract class OcrService {
  // Reading, extraction, chat search and chat attachments only work on OCR documents
  static async showDocument(uuid: string) {
    const asset = await FileLibraryAssetsService.show(uuid);
    if (asset.type !== FileLibraryAssetType.OCR_DOCUMENT) {
      throw new UnprocessableEntityException('Bu dosya bir OCR belgesi değil');
    }
    return asset;
  }

  private static async loadDocument(uuid: string): Promise<OcrDocument> {
    const asset = await this.showDocument(uuid);

    const filePath = getStoragePath(asset.path);

    // PDFs are read with the boilerplate PDF service (text layer), images go to the vision model
    if (asset.mimeType === FileLibraryAssetMimeType.DOCUMENT_PDF) {
      const text = await pdfService.extractTextFromFile(filePath);
      if (text.trim()) {
        return { asset, text };
      }

      // Scanned PDF has no text layer, so its pages go to the vision model as images
      const pageCount = await pdfService.getPageCountFromFile(filePath);
      if (pageCount > FILE_LIBRARY_ASSET_OCR_PDF_MAX_PAGES) {
        throw new UnprocessableEntityException(
          `Taranmış PDF en fazla ${FILE_LIBRARY_ASSET_OCR_PDF_MAX_PAGES} sayfa olabilir`,
        );
      }
      const pages = await pdfService.renderPagesFromFile(filePath, {
        scale: FILE_LIBRARY_ASSET_OCR_PDF_RENDER_SCALE,
      });
      return { asset, images: pages.map((image) => ({ image, mimeType: 'image/png' })) };
    }

    const image = await fs.promises.readFile(filePath);
    const mimeType = asset.mimeType.replace('_', '/').toLowerCase();

    return { asset, images: [{ image, mimeType }] };
  }

  private static toContent(prompt: string, document: OcrDocument) {
    if ('text' in document) {
      // Very long text keeps its beginning and end (headers and totals) within the model limit
      const half = FILE_LIBRARY_ASSET_OCR_TEXT_PART_SIZE / 2;
      const text =
        document.text.length > FILE_LIBRARY_ASSET_OCR_TEXT_PART_SIZE
          ? `${document.text.slice(0, half)}\n…\n${document.text.slice(-half)}`
          : document.text;
      return [{ type: 'text' as const, text: `${prompt}\n\n${text}` }];
    }
    return [
      { type: 'text' as const, text: prompt },
      ...document.images.map(({ image, mimeType }) => ({
        type: 'image' as const,
        image,
        mimeType,
      })),
    ];
  }

  static async saveMetadata(uuid: string, data: Record<string, unknown>) {
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
      const document = await this.loadDocument(uuid);

      // A PDF's text is already read by the PDF service, so no AI call is needed
      if ('text' in document) {
        const updatedAsset = await this.saveMetadata(uuid, { text: document.text });
        return FileLibraryAssetFormatter.response(updatedAsset);
      }

      const agent = mastra.getAgent('ocrAgent');
      const result = await agent.generate([
        { role: 'user', content: this.toContent(FILE_LIBRARY_ASSET_OCR_READ_PROMPT, document) },
      ]);

      const updatedAsset = await this.saveMetadata(uuid, { text: result.text });

      return FileLibraryAssetFormatter.response(updatedAsset);
    } catch (error) {
      throw toAgentHttpError(
        error,
        'OcrService.read',
        'Yapay zekâ servisi belgeyi işleyemedi, tekrar deneyin',
      );
    }
  }

  static async summarize(uuid: string) {
    try {
      const document = await this.loadDocument(uuid);
      const { asset } = document;

      // A saved summary is reused so the same document is not summarized twice
      const metadata = asset.metadata as { summary?: string } | null;
      if (metadata?.summary) {
        return FileLibraryAssetFormatter.response(asset);
      }

      const agent = mastra.getAgent('ocrAgent');
      let content: OcrDocument = document;

      // Long text is summarized part by part first, then the part summaries are summarized
      if ('text' in document && document.text.length > FILE_LIBRARY_ASSET_OCR_TEXT_PART_SIZE) {
        const partSummaries: string[] = [];
        for (const part of splitText(document.text, FILE_LIBRARY_ASSET_OCR_TEXT_PART_SIZE)) {
          const partResult = await agent.generate([
            {
              role: 'user',
              content: this.toContent(FILE_LIBRARY_ASSET_OCR_PART_SUMMARY_PROMPT, {
                asset,
                text: part,
              }),
            },
          ]);
          partSummaries.push(partResult.text);
        }
        content = { asset, text: partSummaries.join('\n\n') };
      }

      const result = await agent.generate([
        { role: 'user', content: this.toContent(FILE_LIBRARY_ASSET_OCR_SUMMARY_PROMPT, content) },
      ]);

      const updatedAsset = await this.saveMetadata(uuid, { summary: result.text });

      return FileLibraryAssetFormatter.response(updatedAsset);
    } catch (error) {
      throw toAgentHttpError(
        error,
        'OcrService.summarize',
        'Yapay zekâ servisi belgeyi özetleyemedi, tekrar deneyin',
      );
    }
  }

  // Manual correction of extracted data: checked against the same schema, then validated again
  static async updateExtraction(
    uuid: string,
    { extraction }: FileLibraryAssetExtractionUpdateInput,
  ) {
    const asset = await this.showDocument(uuid);
    const metadata = asset.metadata as { documentType?: FileLibraryAssetOcrDocumentType } | null;
    if (!metadata?.documentType) {
      throw new UnprocessableEntityException('Önce belgedeki bilgileri ayıklayın');
    }

    const parsed =
      FILE_LIBRARY_ASSET_OCR_EXTRACTORS[metadata.documentType].schema.safeParse(extraction);
    if (!parsed.success) {
      throw new UnprocessableEntityException('Ayıklanan bilgiler geçersiz');
    }

    const updatedAsset = await this.saveMetadata(uuid, {
      extraction: parsed.data,
      validation: ValidationService.validate(metadata.documentType, parsed.data),
    });

    return FileLibraryAssetFormatter.response(updatedAsset);
  }

  static async extract(uuid: string) {
    try {
      const document = await this.loadDocument(uuid);
      const agent = mastra.getAgent('ocrAgent');

      // The document type is found once and reused on later extractions
      const metadata = document.asset.metadata as {
        documentType?: FileLibraryAssetOcrDocumentType;
      } | null;
      const documentType =
        metadata?.documentType ??
        (
          await agent.generate(
            [
              {
                role: 'user',
                content: this.toContent(FILE_LIBRARY_ASSET_OCR_CLASSIFY_PROMPT, document),
              },
            ],
            {
              structuredOutput: {
                schema: FILE_LIBRARY_ASSET_OCR_CLASSIFY_SCHEMA,
                jsonPromptInjection: 'auto',
              },
              modelSettings: { temperature: 0 },
            },
          )
        ).object.documentType;

      const extractor: { prompt: string; schema: z.ZodType<FileLibraryAssetOcrExtraction> } =
        FILE_LIBRARY_ASSET_OCR_EXTRACTORS[documentType];
      const result = await agent.generate(
        [{ role: 'user', content: this.toContent(extractor.prompt, document) }],
        {
          structuredOutput: {
            schema: extractor.schema,
            jsonPromptInjection: 'auto',
          },
          modelSettings: { temperature: 0 },
        },
      );

      const updatedAsset = await this.saveMetadata(uuid, {
        documentType,
        extraction: result.object,
        validation: ValidationService.validate(documentType, result.object),
      });

      return FileLibraryAssetFormatter.response(updatedAsset);
    } catch (error) {
      throw toAgentHttpError(
        error,
        'OcrService.extract',
        'Yapay zekâ servisi belgeyi işleyemedi, tekrar deneyin',
      );
    }
  }
}

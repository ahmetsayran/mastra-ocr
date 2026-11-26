import prisma from '@onlyjs/db';
import { Prisma } from '@onlyjs/db/client';
import { randomUUID } from 'crypto';
import { documentEmbedder } from '../../../mastra/embedders/document-embedder';
import { splitText, toAgentHttpError } from '../../../utils';
import {
  FILE_LIBRARY_ASSET_RAG_CHUNK_SIZE,
  FILE_LIBRARY_ASSET_RAG_EMBED_BATCH_SIZE,
  FILE_LIBRARY_ASSET_RAG_SEARCH_LIMIT,
} from '../constants';
import { FileLibraryAssetFormatter } from '../formatters';
import { FileLibraryAssetsService } from '../service';
import { OcrService } from './ocr.service';

export abstract class RagService {
  private static chunk(text: string) {
    const chunks: string[] = [];
    let current = '';

    for (const paragraph of text
      .split(/\n\s*\n/)
      .flatMap((p) => splitText(p, FILE_LIBRARY_ASSET_RAG_CHUNK_SIZE))) {
      if (current && current.length + paragraph.length > FILE_LIBRARY_ASSET_RAG_CHUNK_SIZE) {
        chunks.push(current.trim());
        current = '';
      }
      current += `${paragraph}\n\n`;
    }
    if (current.trim()) chunks.push(current.trim());

    return chunks;
  }

  private static toVector(values: number[]) {
    return `[${values.join(',')}]`;
  }

  // Long documents are embedded in batches so a single request stays within provider limits
  private static async embed(values: string[]) {
    const embeddings: number[][] = [];
    for (let i = 0; i < values.length; i += FILE_LIBRARY_ASSET_RAG_EMBED_BATCH_SIZE) {
      const batch = values.slice(i, i + FILE_LIBRARY_ASSET_RAG_EMBED_BATCH_SIZE);
      const result = await documentEmbedder.doEmbed({ values: batch });
      embeddings.push(...result.embeddings);
    }
    return embeddings;
  }

  // A failed indexing is marked on the document, so the panel can warn and offer a retry
  static async index(uuid: string) {
    const asset = await OcrService.showDocument(uuid);

    try {
      // A retry reuses the text that was already read, so no AI request is spent on it again
      if ((asset.metadata as { text?: string } | null)?.text === undefined) {
        await OcrService.read(uuid);
      }
      const { metadata } = await FileLibraryAssetsService.show(uuid);
      const text = (metadata as { text?: string } | null)?.text ?? '';
      const chunks = this.chunk(text);

      if (chunks.length) {
        const embeddings = await this.embed(chunks);

        await prisma.$transaction([
          prisma.documentChunk.deleteMany({ where: { assetId: asset.id } }),
          ...chunks.map(
            (content, i) => prisma.$executeRaw`
              INSERT INTO "document_chunks" ("uuid", "asset_id", "content", "embedding", "created_at")
              VALUES (${randomUUID()}, ${asset.id}, ${content}, ${this.toVector(embeddings[i]!)}::vector, now() AT TIME ZONE 'UTC')
            `,
          ),
        ]);
      }
    } catch (error) {
      await OcrService.saveMetadata(uuid, { indexFailed: true });
      throw toAgentHttpError(
        error,
        'RagService.index',
        'Belge sohbet aramasına hazırlanamadı, tekrar deneyin',
      );
    }

    const updatedAsset = await OcrService.saveMetadata(uuid, { indexFailed: false });
    return FileLibraryAssetFormatter.response(updatedAsset);
  }

  static indexInBackground(uuid: string) {
    // Background task (fire-and-forget)
    void (async () => {
      try {
        await this.index(uuid);
      } catch (error) {
        console.error('Document indexing background task error:', error);
      }
    })();
  }

  static async search(query: string, assetIds: number[] = []) {
    const [vector] = await this.embed([query]);
    const assetFilter = assetIds.length
      ? Prisma.sql`AND a."id" IN (${Prisma.join(assetIds)})`
      : Prisma.empty;

    return prisma.$queryRaw<{ content: string }[]>`
      SELECT c."content"
      FROM "document_chunks" c
      JOIN "file_library_assets" a ON a."id" = c."asset_id"
      WHERE a."deleted_at" IS NULL ${assetFilter}
      ORDER BY c."embedding" <=> ${this.toVector(vector!)}::vector
      LIMIT ${FILE_LIBRARY_ASSET_RAG_SEARCH_LIMIT}
    `;
  }
}

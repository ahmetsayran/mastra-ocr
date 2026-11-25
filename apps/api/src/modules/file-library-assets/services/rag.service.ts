import prisma from '@onlyjs/db';
import { FileLibraryAssetType, Prisma } from '@onlyjs/db/client';
import { randomUUID } from 'crypto';
import { documentEmbedder } from '../../../mastra/embedders/document-embedder';
import {
  FILE_LIBRARY_ASSET_RAG_CHUNK_SIZE,
  FILE_LIBRARY_ASSET_RAG_EMBED_BATCH_SIZE,
  FILE_LIBRARY_ASSET_RAG_SEARCH_LIMIT,
} from '../constants';
import { splitText } from '../../../utils';
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

  static async index(uuid: string) {
    const asset = await FileLibraryAssetsService.show(uuid);
    if (asset.type !== FileLibraryAssetType.OCR_DOCUMENT) return;

    await OcrService.read(uuid);
    const { metadata } = await FileLibraryAssetsService.show(uuid);
    const text = (metadata as { text?: string } | null)?.text ?? '';
    const chunks = this.chunk(text);
    if (chunks.length === 0) return;

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

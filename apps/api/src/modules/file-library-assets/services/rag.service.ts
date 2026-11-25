import prisma from '@onlyjs/db';
import { FileLibraryAssetType, Prisma } from '@onlyjs/db/client';
import { randomUUID } from 'crypto';
import { documentEmbedder } from '../../../mastra/embedders/document-embedder';
import {
  FILE_LIBRARY_ASSET_RAG_CHUNK_SIZE,
  FILE_LIBRARY_ASSET_RAG_SEARCH_LIMIT,
} from '../constants';
import { FileLibraryAssetsService } from '../service';
import { OcrService } from './ocr.service';

export abstract class RagService {
  // PDF text has no line breaks, so a paragraph longer than a chunk is split at word boundaries
  private static split(paragraph: string) {
    if (paragraph.length <= FILE_LIBRARY_ASSET_RAG_CHUNK_SIZE) return [paragraph];

    const parts: string[] = [];
    let part = '';

    for (const word of paragraph.split(/\s+/)) {
      if (part && part.length + word.length + 1 > FILE_LIBRARY_ASSET_RAG_CHUNK_SIZE) {
        parts.push(part);
        part = '';
      }
      part += part ? ` ${word}` : word;
    }
    if (part) parts.push(part);

    return parts;
  }

  private static chunk(text: string) {
    const chunks: string[] = [];
    let current = '';

    for (const paragraph of text.split(/\n\s*\n/).flatMap((p) => this.split(p))) {
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

  private static async embed(values: string[]) {
    const { embeddings } = await documentEmbedder.doEmbed({ values });
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

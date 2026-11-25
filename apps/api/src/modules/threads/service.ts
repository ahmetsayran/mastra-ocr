import prisma from '@onlyjs/db';
import { ChatMessageRole, FileLibraryAssetType, Prisma } from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import { RequestContext } from '@mastra/core/request-context';
import { mastra } from '../../mastra';
import { chatInputProcessors, chatOutputProcessors } from '../../mastra/processors/chat-guardrails';
import { NotFoundException, UnprocessableEntityException } from '../../utils';
import { toAgentHttpError } from '../../utils/agent-errors';
import { PaginationService } from '../../utils/pagination';
import { CHAT_HISTORY_LIMIT, CHAT_STREAM_CHUNK_DELAY_MS } from './constants';
import { FileLibraryAssetsService } from '../file-library-assets';
import { RagService } from '../file-library-assets/services/rag.service';
import type {
  ThreadAttachmentPayload,
  ThreadCreatePayload,
  ThreadIndexQuery,
  ThreadMessagePayload,
  ThreadUpdatePayload,
} from './types';

export abstract class ThreadsService {
  private static handlePrismaError(
    error: unknown,
    context: 'find' | 'create' | 'update' | 'delete',
  ): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Sohbet bulunamadı');
      }
    }
    console.error(`Error in ThreadsService.${context}:`, error);
    throw error;
  }

  static async index(query: ThreadIndexQuery, resourceId: string) {
    try {
      const { skip, perPage } = PaginationService.getPaginationParams(query);
      const where: Prisma.ThreadWhereInput = {
        resourceId,
        deletedAt: null,
        ...(query.search && {
          title: {
            contains: query.search.toLocaleLowerCase('tr'),
            mode: Prisma.QueryMode.insensitive,
          },
        }),
      };

      const [data, total] = await Promise.all([
        prisma.thread.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.thread.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      this.handlePrismaError(error, 'find');
    }
  }

  static async show(uuid: string, resourceId: string) {
    try {
      const thread = await prisma.thread.findFirst({
        where: { uuid, resourceId, deletedAt: null },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { asset: { select: { id: true, uuid: true, name: true, title: true } } },
          },
        },
      });

      if (!thread) {
        throw new NotFoundException('Sohbet bulunamadı');
      }

      return thread;
    } catch (error) {
      this.handlePrismaError(error, 'find');
    }
  }

  static async store(data: ThreadCreatePayload, resourceId: string) {
    try {
      return await prisma.thread.create({
        data: { ...data, resourceId },
      });
    } catch (error) {
      this.handlePrismaError(error, 'create');
    }
  }

  static async update(uuid: string, data: ThreadUpdatePayload, resourceId: string) {
    try {
      return await prisma.thread.update({
        where: { uuid, resourceId, deletedAt: null },
        data,
      });
    } catch (error) {
      this.handlePrismaError(error, 'update');
    }
  }

  static async destroy(uuid: string, resourceId: string) {
    try {
      return await prisma.thread.delete({
        where: { uuid, resourceId, deletedAt: null },
      });
    } catch (error) {
      this.handlePrismaError(error, 'delete');
    }
  }

  static async attach(uuid: string, { assetUuid }: ThreadAttachmentPayload, resourceId: string) {
    const thread = await this.show(uuid, resourceId);
    const asset = await FileLibraryAssetsService.show(assetUuid);
    if (asset.type !== FileLibraryAssetType.OCR_DOCUMENT) {
      throw new UnprocessableEntityException('Bu dosya bir OCR belgesi değil');
    }

    try {
      return await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          role: ChatMessageRole.USER,
          content: asset.title ?? asset.name,
          assetId: asset.id,
        },
        include: { asset: { select: { uuid: true, name: true, title: true } } },
      });
    } catch (error) {
      this.handlePrismaError(error, 'create');
    }
  }

  private static async addMessage(threadId: number, role: ChatMessageRole, content: string) {
    try {
      await prisma.chatMessage.create({
        data: { threadId, role, content },
      });
    } catch (error) {
      this.handlePrismaError(error, 'create');
    }
  }

  private static async generate(
    content: string,
    userId: string,
    history: {
      role: ChatMessageRole;
      content: string;
      asset: { id: number; uuid: string; name: string; title: string | null } | null;
    }[],
  ) {
    try {
      // Earlier messages go to context, so input guardrails only check the new message
      const context: { role: 'system' | 'user' | 'assistant'; content: string }[] = history
        .slice(-CHAT_HISTORY_LIMIT)
        .map((message) => ({
          role: message.role === ChatMessageRole.USER ? 'user' : 'assistant',
          content: message.asset
            ? `[Sohbete belge eklendi: ${message.asset.title ?? message.asset.name} (uuid: ${message.asset.uuid})]`
            : message.content,
        }));

      // Documents attached to this chat are searched first; otherwise all documents
      const attachedAssetIds = history.flatMap((message) =>
        message.asset ? [message.asset.id] : [],
      );
      const chunks = await RagService.search(content, attachedAssetIds);
      if (chunks.length) {
        context.push({
          role: 'system',
          content: `Belgelerden ilgili bölümler:\n\n${chunks.map((chunk: { content: string }) => chunk.content).join('\n---\n')}`,
        });
      }

      const agent = mastra.getAgent('ocrAgent');
      const result = await agent.generate(content, {
        context,
        requestContext: new RequestContext([['userId', userId]]),
        inputProcessors: chatInputProcessors,
        outputProcessors: chatOutputProcessors,
      });

      if (result.tripwire) {
        throw new UnprocessableEntityException('Mesaj güvenlik kontrolüne takıldı');
      }
      return result.text;
    } catch (error) {
      throw toAgentHttpError(
        error,
        'ThreadsService.generate',
        'Yapay zekâ servisi cevap veremedi, tekrar deneyin',
      );
    }
  }

  // Streams the buffered answer word by word so it appears as typing
  static async *streamWords(text: string) {
    for (const chunk of text.match(/\S+\s*/g) ?? []) {
      yield chunk;
      await Bun.sleep(CHAT_STREAM_CHUNK_DELAY_MS);
    }
  }

  static async reply(uuid: string, payload: ThreadMessagePayload, resourceId: string) {
    const thread = await this.show(uuid, resourceId);

    const text = await this.generate(payload.content, resourceId, thread.messages);
    await this.addMessage(thread.id, ChatMessageRole.USER, payload.content);
    await this.addMessage(thread.id, ChatMessageRole.ASSISTANT, text);

    return text;
  }
}

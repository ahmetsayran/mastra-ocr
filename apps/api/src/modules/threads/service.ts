import prisma from '@onlyjs/db';
import { ChatMessageRole } from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import { RequestContext } from '@mastra/core/request-context';
import { mastra } from '../../mastra';
import { chatInputProcessors, chatOutputProcessors } from '../../mastra/processors/chat-guardrails';
import { NotFoundException, UnprocessableEntityException } from '../../utils';
import { toAgentHttpError } from '../../utils/agent-errors';
import { PaginationService, type PaginationQuery } from '../../utils/pagination';
import { CHAT_STREAM_CHUNK_DELAY_MS } from './constants';
import { RagService } from '../file-library-assets/services/rag.service';
import type { ThreadCreatePayload, ThreadMessagePayload, ThreadUpdatePayload } from './types';

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

  static async index(query: PaginationQuery, resourceId: string) {
    try {
      const { skip, perPage } = PaginationService.getPaginationParams(query);
      const where = { resourceId, deletedAt: null };

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
        include: { messages: { orderBy: { createdAt: 'asc' } } },
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

  private static async addMessage(threadId: number, role: ChatMessageRole, content: string) {
    try {
      await prisma.chatMessage.create({
        data: { threadId, role, content },
      });
    } catch (error) {
      this.handlePrismaError(error, 'create');
    }
  }

  private static async generate(content: string, userId: string) {
    try {
      const chunks = await RagService.search(content);
      const context = chunks.length
        ? [
            {
              role: 'system' as const,
              content: `Belgelerden ilgili bölümler:\n\n${chunks.map((chunk: { content: string }) => chunk.content).join('\n---\n')}`,
            },
          ]
        : undefined;

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

    const text = await this.generate(payload.content, resourceId);
    await this.addMessage(thread.id, ChatMessageRole.USER, payload.content);
    await this.addMessage(thread.id, ChatMessageRole.ASSISTANT, text);

    return text;
  }
}

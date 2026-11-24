import prisma from '@onlyjs/db';
import { ChatMessageRole } from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import { mastra } from '../../mastra';
import {
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException,
  TooManyRequestsException,
} from '../../utils';
import { PaginationService, type PaginationQuery } from '../../utils/pagination';
import type { ThreadCreatePayload, ThreadMessagePayload } from './types';

export abstract class ThreadsService {
  private static handlePrismaError(error: unknown, context: 'find' | 'create'): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Sohbet bulunamadı');
      }
    }
    console.error(`Error in ThreadsService.${context}:`, error);
    throw error;
  }

  private static handleAgentError(error: unknown): never {
    console.error('Error in ThreadsService.generate:', error);

    const statusCode =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? error.statusCode
        : undefined;

    if (statusCode === 429) {
      throw new TooManyRequestsException(
        'Yapay zekâ servisi şu an yoğun, biraz sonra tekrar deneyin',
      );
    }
    if (statusCode === 401 || statusCode === 402 || statusCode === 403) {
      throw new ServiceUnavailableException(
        'Yapay zekâ servisine bağlanılamadı, OpenRouter anahtarını kontrol edin',
      );
    }
    throw new BadGatewayException('Yapay zekâ servisi cevap veremedi, tekrar deneyin');
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

  static async show(threadId: string, resourceId: string) {
    try {
      const thread = await prisma.thread.findFirst({
        where: { uuid: threadId, resourceId, deletedAt: null },
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

  private static async addMessage(threadId: number, role: ChatMessageRole, content: string) {
    try {
      await prisma.chatMessage.create({
        data: { threadId, role, content },
      });
    } catch (error) {
      this.handlePrismaError(error, 'create');
    }
  }

  private static async generate(content: string) {
    try {
      const agent = mastra.getAgent('ocrAgent');
      const result = await agent.generate(content);
      return result.text;
    } catch (error) {
      this.handleAgentError(error);
    }
  }

  static async reply(threadId: string, payload: ThreadMessagePayload, resourceId: string) {
    const thread = await this.show(threadId, resourceId);

    const text = await this.generate(payload.content);
    await this.addMessage(thread.id, ChatMessageRole.USER, payload.content);
    await this.addMessage(thread.id, ChatMessageRole.ASSISTANT, text);

    return text;
  }
}

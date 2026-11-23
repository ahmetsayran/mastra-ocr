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
import type { ChatThreadCreatePayload, ChatThreadMessagePayload } from './types';

export abstract class ChatThreadsService {
  private static handlePrismaError(error: unknown, context: 'find' | 'create'): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Sohbet bulunamadı');
      }
    }
    console.error(`Error in ChatThreadsService.${context}:`, error);
    throw error;
  }

  private static handleAgentError(error: unknown): never {
    console.error('Error in ChatThreadsService.generate:', error);

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
        prisma.chatThread.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.chatThread.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      this.handlePrismaError(error, 'find');
    }
  }

  static async show(uuid: string, resourceId: string) {
    try {
      const thread = await prisma.chatThread.findFirst({
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

  static async store(data: ChatThreadCreatePayload, resourceId: string) {
    try {
      return await prisma.chatThread.create({
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
      const agent = mastra.getAgent('chatAgent');
      const result = await agent.generate(content);
      return result.text;
    } catch (error) {
      this.handleAgentError(error);
    }
  }

  static async reply(uuid: string, payload: ChatThreadMessagePayload, resourceId: string) {
    const thread = await this.show(uuid, resourceId);

    const text = await this.generate(payload.content);
    await this.addMessage(thread.id, ChatMessageRole.USER, payload.content);
    await this.addMessage(thread.id, ChatMessageRole.ASSISTANT, text);

    return text;
  }
}

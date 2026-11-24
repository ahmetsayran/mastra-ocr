import prisma from '@onlyjs/db';
import type { Prisma } from '@onlyjs/db/client';
import { PrismaClientKnownRequestError } from '@onlyjs/db/client/runtime/library';
import { NotFoundException } from '../../utils';
import { PaginationService } from '../../utils/pagination';
import type {
  PostCommentCreatePayload,
  PostCommentIndexQuery,
  PostCommentUpdatePayload,
} from './types';

export abstract class PostCommentsService {
  private static handlePrismaError(
    error: unknown,
    context: 'find' | 'create' | 'update' | 'delete',
  ): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // On create, the missing record is the post being connected
        throw new NotFoundException(
          context === 'create' ? 'Gönderi bulunamadı' : 'Yorum bulunamadı',
        );
      }
    }
    console.error(`Error in PostCommentsService.${context}:`, error);
    throw error;
  }

  static async index(query: PostCommentIndexQuery) {
    try {
      const { skip, perPage } = PaginationService.getPaginationParams(query);

      const where: Prisma.PostCommentWhereInput = query.postUuid
        ? { post: { uuid: query.postUuid } }
        : {};

      const [data, total] = await Promise.all([
        prisma.postComment.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.postComment.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      this.handlePrismaError(error, 'find');
    }
  }

  static async show(uuid: string) {
    try {
      const comment = await prisma.postComment.findUnique({
        where: { uuid },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException('Yorum bulunamadı');
      }

      return comment;
    } catch (error) {
      this.handlePrismaError(error, 'find');
    }
  }

  static async store({ postUuid, ...data }: PostCommentCreatePayload, authorId: string) {
    try {
      return await prisma.postComment.create({
        data: {
          ...data,
          post: { connect: { uuid: postUuid } },
          author: { connect: { id: authorId } },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error, 'create');
    }
  }

  static async update(uuid: string, data: PostCommentUpdatePayload) {
    try {
      const comment = await prisma.postComment.update({
        where: { uuid },
        data,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException('Yorum bulunamadı');
      }

      return comment;
    } catch (error) {
      this.handlePrismaError(error, 'update');
    }
  }

  static async destroy(uuid: string) {
    try {
      const comment = await prisma.postComment.delete({
        where: { uuid },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException('Yorum bulunamadı');
      }

      return comment;
    } catch (error) {
      this.handlePrismaError(error, 'delete');
    }
  }
}

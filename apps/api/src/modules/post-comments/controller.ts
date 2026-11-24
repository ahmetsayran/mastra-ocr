import { Elysia } from 'elysia';
import { dtoWithMiddlewares, NotFoundException } from '../../utils';
import { PaginationService } from '../../utils/pagination';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../audit-logs';
import { auth, PERMISSIONS, withPermission } from '../auth';
import {
  postCommentCreateDto,
  postCommentDestroyDto,
  postCommentIndexDto,
  postCommentShowDto,
  postCommentUpdateDto,
} from './dtos';
import { PostCommentFormatter } from './formatters';
import { PostCommentsService } from './service';

const app = new Elysia({ prefix: '/post-comments', tags: ['Post Comment'] })
  .get(
    '/',
    async ({ query }) => {
      const { data, total } = await PostCommentsService.index(query);
      return PaginationService.createPaginatedResponse({
        data,
        total,
        query,
        formatter: PostCommentFormatter.response,
      });
    },
    postCommentIndexDto,
  )
  .get(
    '/:uuid',
    async ({ params }) => {
      const comment = await PostCommentsService.show(params.uuid);
      if (!comment) throw new NotFoundException('Yorum bulunamadı');
      return PostCommentFormatter.response(comment);
    },
    postCommentShowDto,
  )
  .use(auth())
  .post(
    '/',
    async ({ body, user }) => {
      const comment = await PostCommentsService.store(body, user.id);
      return PostCommentFormatter.response(comment);
    },
    dtoWithMiddlewares(
      postCommentCreateDto,
      withPermission(PERMISSIONS.POST_COMMENTS.CREATE),
      withAuditLog({
        actionType: AuditLogAction.CREATE,
        entityType: AuditLogEntity.POST_COMMENT,
        getEntityUuid: (ctx) => {
          // @ts-ignore // TODO: fix this
          const response = ctx.response as ReturnType<typeof PostCommentFormatter.response>;
          return response.uuid;
        },
        getDescription: () => 'Gönderiye yorum eklendi',
      }),
    ),
  )
  .put(
    '/:uuid',
    async ({ params, body }) => {
      const comment = await PostCommentsService.update(params.uuid, body);
      if (!comment) throw new NotFoundException('Yorum bulunamadı');
      return PostCommentFormatter.response(comment);
    },
    dtoWithMiddlewares(
      postCommentUpdateDto,
      withPermission(PERMISSIONS.POST_COMMENTS.UPDATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.POST_COMMENT,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: ({ body }) =>
          `Yorum güncellendi: ${Object.keys(body as object).join(', ')}`,
        getMetadata: ({ body }) => ({ updatedFields: body }),
      }),
    ),
  )
  .delete(
    '/:uuid',
    async ({ params }) => {
      const comment = await PostCommentsService.destroy(params.uuid);
      if (!comment) throw new NotFoundException('Yorum bulunamadı');
      return { message: 'Yorum başarıyla silindi' };
    },
    dtoWithMiddlewares(
      postCommentDestroyDto,
      withPermission(PERMISSIONS.POST_COMMENTS.DESTROY),
      withAuditLog({
        actionType: AuditLogAction.DELETE,
        entityType: AuditLogEntity.POST_COMMENT,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => 'Yorum silindi',
      }),
    ),
  );

export default app;

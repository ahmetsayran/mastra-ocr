import { Elysia } from 'elysia';
import { dtoWithMiddlewares } from '../../utils';
import { PaginationService } from '../../utils/pagination';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../audit-logs';
import { auth, dtoWithPermission, PERMISSIONS, withPermission } from '../auth';
import {
  threadCreateDto,
  threadDestroyDto,
  threadIndexDto,
  threadMessageDto,
  threadShowDto,
  threadUpdateDto,
} from './dtos';
import { ThreadFormatter } from './formatters';
import { ThreadsService } from './service';

const app = new Elysia({ prefix: '/threads', tags: ['Thread'] })
  .use(auth())
  .get(
    '/',
    async ({ query, user }) => {
      const { data, total } = await ThreadsService.index(query, user.id);
      return PaginationService.createPaginatedResponse({
        data,
        total,
        query,
        formatter: ThreadFormatter.response,
      });
    },
    dtoWithPermission(threadIndexDto, PERMISSIONS.THREADS.SHOW),
  )
  .get(
    '/:uuid',
    async ({ params, user }) => {
      const thread = await ThreadsService.show(params.uuid, user.id);
      return ThreadFormatter.detail(thread);
    },
    dtoWithPermission(threadShowDto, PERMISSIONS.THREADS.SHOW),
  )
  .post(
    '/',
    async ({ body, user }) => {
      const thread = await ThreadsService.store(body, user.id);
      return ThreadFormatter.response(thread);
    },
    dtoWithMiddlewares(
      threadCreateDto,
      withPermission(PERMISSIONS.THREADS.CREATE),
      withAuditLog({
        actionType: AuditLogAction.CREATE,
        entityType: AuditLogEntity.THREAD,
        getEntityUuid: (ctx) => {
          // @ts-ignore
          const response = ctx.response as ReturnType<typeof ThreadFormatter.response>;
          return response.uuid;
        },
        getDescription: () => 'Yeni sohbet oluşturuldu',
      }),
    ),
  )
  .put(
    '/:uuid',
    async ({ params, body, user }) => {
      const thread = await ThreadsService.update(params.uuid, body, user.id);
      return ThreadFormatter.response(thread);
    },
    dtoWithMiddlewares(
      threadUpdateDto,
      withPermission(PERMISSIONS.THREADS.UPDATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.THREAD,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: ({ body }) =>
          `Sohbet güncellendi: ${Object.keys(body as object).join(', ')}`,
        getMetadata: ({ body }) => ({ updatedFields: body }),
      }),
    ),
  )
  .delete(
    '/:uuid',
    async ({ params, user }) => {
      await ThreadsService.destroy(params.uuid, user.id);
      return { message: 'Sohbet başarıyla silindi' };
    },
    dtoWithMiddlewares(
      threadDestroyDto,
      withPermission(PERMISSIONS.THREADS.DESTROY),
      withAuditLog({
        actionType: AuditLogAction.DELETE,
        entityType: AuditLogEntity.THREAD,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => 'Sohbet silindi',
      }),
    ),
  )
  .post(
    '/:uuid/messages',
    async ({ params, body, user }) => {
      // Full buffering: the whole answer is ready before streaming starts
      const text = await ThreadsService.reply(params.uuid, body, user.id);
      return ThreadsService.streamWords(text);
    },
    dtoWithMiddlewares(
      threadMessageDto,
      withPermission(PERMISSIONS.THREADS.CREATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.THREAD,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => 'Sohbete mesaj gönderildi',
      }),
    ),
  );

export default app;

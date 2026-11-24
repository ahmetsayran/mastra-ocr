import { Elysia } from 'elysia';
import { dtoWithMiddlewares } from '../../utils';
import { PaginationService } from '../../utils/pagination';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../audit-logs';
import { auth, dtoWithPermission, PERMISSIONS, withPermission } from '../auth';
import { CHAT_STREAM_CHUNK_DELAY_MS } from './constants';
import { threadCreateDto, threadIndexDto, threadMessageDto, threadShowDto } from './dtos';
import { ThreadFormatter } from './formatters';
import { ThreadsService } from './service';

async function* streamWords(text: string) {
  for (const chunk of text.match(/\S+\s*/g) ?? []) {
    yield chunk;
    await Bun.sleep(CHAT_STREAM_CHUNK_DELAY_MS);
  }
}

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
    '/:threadId',
    async ({ params, user }) => {
      const thread = await ThreadsService.show(params.threadId, user.id);
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
  .post(
    '/:threadId/messages',
    async ({ params, body, user }) => {
      // Full buffering: the whole answer is ready before streaming starts
      const text = await ThreadsService.reply(params.threadId, body, user.id);
      return streamWords(text);
    },
    dtoWithMiddlewares(
      threadMessageDto,
      withPermission(PERMISSIONS.THREADS.CREATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.THREAD,
        getEntityUuid: ({ params }) => params.threadId!,
        getDescription: () => 'Sohbete mesaj gönderildi',
      }),
    ),
  );

export default app;

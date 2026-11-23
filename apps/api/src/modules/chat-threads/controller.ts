import { Elysia } from 'elysia';
import { dtoWithMiddlewares } from '../../utils';
import { PaginationService } from '../../utils/pagination';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../audit-logs';
import { auth, dtoWithPermission, PERMISSIONS, withPermission } from '../auth';
import { CHAT_STREAM_CHUNK_DELAY_MS } from './constants';
import {
  chatThreadCreateDto,
  chatThreadIndexDto,
  chatThreadMessageDto,
  chatThreadShowDto,
} from './dtos';
import { ChatThreadFormatter } from './formatters';
import { ChatThreadsService } from './service';

async function* streamWords(text: string) {
  for (const chunk of text.match(/\S+\s*/g) ?? []) {
    yield chunk;
    await Bun.sleep(CHAT_STREAM_CHUNK_DELAY_MS);
  }
}

const app = new Elysia({ prefix: '/chat-threads', tags: ['Chat Thread'] })
  .use(auth())
  .get(
    '/',
    async ({ query, user }) => {
      const { data, total } = await ChatThreadsService.index(query, user.id);
      return PaginationService.createPaginatedResponse({
        data,
        total,
        query,
        formatter: ChatThreadFormatter.response,
      });
    },
    dtoWithPermission(chatThreadIndexDto, PERMISSIONS.CHAT_THREADS.SHOW),
  )
  .get(
    '/:uuid',
    async ({ params, user }) => {
      const thread = await ChatThreadsService.show(params.uuid, user.id);
      return ChatThreadFormatter.detail(thread);
    },
    dtoWithPermission(chatThreadShowDto, PERMISSIONS.CHAT_THREADS.SHOW),
  )
  .post(
    '/',
    async ({ body, user }) => {
      const thread = await ChatThreadsService.store(body, user.id);
      return ChatThreadFormatter.response(thread);
    },
    dtoWithMiddlewares(
      chatThreadCreateDto,
      withPermission(PERMISSIONS.CHAT_THREADS.CREATE),
      withAuditLog({
        actionType: AuditLogAction.CREATE,
        entityType: AuditLogEntity.CHAT_THREAD,
        getEntityUuid: (ctx) => {
          // @ts-ignore
          const response = ctx.response as ReturnType<typeof ChatThreadFormatter.response>;
          return response.uuid;
        },
        getDescription: () => 'Yeni sohbet oluşturuldu',
      }),
    ),
  )
  .post(
    '/:uuid/messages',
    async ({ params, body, user }) => {
      // Full buffering: the whole answer is ready before streaming starts
      const text = await ChatThreadsService.reply(params.uuid, body, user.id);
      return streamWords(text);
    },
    dtoWithMiddlewares(
      chatThreadMessageDto,
      withPermission(PERMISSIONS.CHAT_THREADS.CREATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.CHAT_THREAD,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => 'Sohbete mesaj gönderildi',
      }),
    ),
  );

export default app;

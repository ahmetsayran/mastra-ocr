import { ChatMessagePlain, ChatMessagePlainInputCreate } from '@onlyjs/db/prismabox/ChatMessage';
import { ChatThreadPlain, ChatThreadPlainInputCreate } from '@onlyjs/db/prismabox/ChatThread';
import { t } from 'elysia';
import { type ControllerHook, errorResponseDto, uuidValidation } from '../../utils';
import { paginationQueryDto, paginationResponseDto } from '../../utils/pagination';

export const chatThreadResponseDto = ChatThreadPlain;

export const chatThreadDetailResponseDto = t.Composite([
  ChatThreadPlain,
  t.Object({
    messages: t.Array(ChatMessagePlain),
  }),
]);

export const chatThreadIndexDto = {
  query: paginationQueryDto,
  response: {
    200: paginationResponseDto(chatThreadResponseDto),
  },
  detail: {
    summary: 'Index',
    description: 'Kullanıcının sohbet listesini döndürür',
  },
} satisfies ControllerHook;

export const chatThreadCreateDto = {
  body: ChatThreadPlainInputCreate,
  response: { 200: chatThreadResponseDto, 422: errorResponseDto[422] },
  detail: {
    summary: 'Create',
    description: 'Yeni sohbet oluşturur',
  },
} satisfies ControllerHook;

export const chatThreadShowDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: chatThreadDetailResponseDto, 404: errorResponseDto[404] },
  detail: {
    summary: 'Show',
    description: 'Sohbeti ve mesajlarını döndürür',
  },
} satisfies ControllerHook;

export const chatThreadMessageDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: t.Pick(ChatMessagePlainInputCreate, ['content']),
  response: {
    404: errorResponseDto[404],
    422: errorResponseDto[422],
    429: errorResponseDto[429],
    502: errorResponseDto[502],
    503: errorResponseDto[503],
  },
  detail: {
    summary: 'Message',
    description: 'Sohbete mesaj gönderir, yapay zekâ cevabını stream olarak döndürür',
  },
} satisfies ControllerHook;

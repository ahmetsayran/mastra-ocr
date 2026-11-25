import { ChatMessagePlain, ChatMessagePlainInputCreate } from '@onlyjs/db/prismabox/ChatMessage';
import {
  ThreadPlain,
  ThreadPlainInputCreate,
  ThreadPlainInputUpdate,
} from '@onlyjs/db/prismabox/Thread';
import { t } from 'elysia';
import { type ControllerHook, errorResponseDto, uuidValidation } from '../../utils';
import { paginationQueryDto, paginationResponseDto } from '../../utils/pagination';

export const threadResponseDto = ThreadPlain;

export const threadMessageResponseDto = t.Composite([
  ChatMessagePlain,
  t.Object({
    asset: t.Nullable(
      t.Object({
        uuid: t.String(),
        name: t.String(),
        title: t.Nullable(t.String()),
      }),
    ),
  }),
]);

export const threadDetailResponseDto = t.Composite([
  ThreadPlain,
  t.Object({
    messages: t.Array(threadMessageResponseDto),
  }),
]);

export const threadIndexDto = {
  query: t.Object({
    ...paginationQueryDto.properties,
    search: t.Optional(t.String()),
  }),
  response: {
    200: paginationResponseDto(threadResponseDto),
  },
  detail: {
    summary: 'Index',
    description: 'Kullanıcının sohbet listesini döndürür',
  },
} satisfies ControllerHook;

export const threadCreateDto = {
  body: ThreadPlainInputCreate,
  response: { 200: threadResponseDto, 422: errorResponseDto[422] },
  detail: {
    summary: 'Create',
    description: 'Yeni sohbet oluşturur',
  },
} satisfies ControllerHook;

export const threadShowDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: threadDetailResponseDto, 404: errorResponseDto[404] },
  detail: {
    summary: 'Show',
    description: 'Sohbeti ve mesajlarını döndürür',
  },
} satisfies ControllerHook;

export const threadUpdateDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: ThreadPlainInputUpdate,
  response: { 200: threadResponseDto, 404: errorResponseDto[404], 422: errorResponseDto[422] },
  detail: {
    summary: 'Update',
    description: 'Sohbetin başlığını günceller',
  },
} satisfies ControllerHook;

export const threadDestroyDto = {
  ...threadShowDto,
  response: { 200: t.Object({ message: t.String() }), 404: errorResponseDto[404] },
  detail: {
    summary: 'Destroy',
    description: 'Sohbeti ve mesajlarını siler',
  },
} satisfies ControllerHook;

export const threadAttachmentDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: t.Object({
    assetUuid: uuidValidation,
  }),
  response: {
    200: threadMessageResponseDto,
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: 'Attachment',
    description: 'Sohbete bir OCR belgesi ekler',
  },
} satisfies ControllerHook;

export const threadMessageDto = {
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

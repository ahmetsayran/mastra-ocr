import {
  PostCommentPlain,
  PostCommentPlainInputCreate,
  PostCommentPlainInputUpdate,
} from '@onlyjs/db/prismabox/PostComment';
import { t } from 'elysia';
import { type ControllerHook, errorResponseDto, uuidValidation } from '../../utils';
import { paginationQueryDto, paginationResponseDto } from '../../utils/pagination';

export const postCommentResponseDto = t.Composite([
  PostCommentPlain,
  t.Object({
    author: t.Object({
      id: t.String(),
      name: t.String(),
    }),
  }),
]);

export const postCommentIndexDto = {
  query: t.Object({
    ...paginationQueryDto.properties,
    postUuid: t.Optional(uuidValidation),
  }),
  response: {
    200: paginationResponseDto(postCommentResponseDto),
  },
  detail: {
    summary: 'Index',
    description: 'Gönderi yorumlarının listesini döndürür',
  },
} satisfies ControllerHook;

export const postCommentCreateDto = {
  body: t.Object({
    ...PostCommentPlainInputCreate.properties,
    postUuid: uuidValidation,
  }),
  response: { 200: postCommentResponseDto, 404: errorResponseDto[404], 422: errorResponseDto[422] },
  detail: {
    summary: 'Create',
    description: 'Gönderiye yeni yorum ekler',
  },
} satisfies ControllerHook;

export const postCommentUpdateDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: PostCommentPlainInputUpdate,
  response: { 200: postCommentResponseDto, 404: errorResponseDto[404], 422: errorResponseDto[422] },
  detail: {
    summary: 'Update',
    description: 'Yorumu günceller',
  },
} satisfies ControllerHook;

export const postCommentShowDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: postCommentResponseDto, 404: errorResponseDto[404] },
  detail: {
    summary: 'Show',
    description: 'Yorum detaylarını döndürür',
  },
} satisfies ControllerHook;

export const postCommentDestroyDto = {
  ...postCommentShowDto,
  response: { 200: t.Object({ message: t.String() }), 404: errorResponseDto[404] },
  detail: {
    summary: 'Destroy',
    description: 'Yorumu siler',
  },
} satisfies ControllerHook;

import type { Static } from 'elysia';
import {
  postCommentCreateDto,
  postCommentIndexDto,
  postCommentResponseDto,
  postCommentShowDto,
  postCommentUpdateDto,
} from './dtos';

export type PostCommentIndexQuery = Static<(typeof postCommentIndexDto)['query']>;
export type PostCommentCreatePayload = Static<(typeof postCommentCreateDto)['body']>;
export type PostCommentUpdatePayload = Static<(typeof postCommentUpdateDto)['body']>;
export type PostCommentShowParams = Static<(typeof postCommentShowDto)['params']>;
export type PostCommentShowResponse = Static<typeof postCommentResponseDto>;
export type PostCommentDestroyParams = PostCommentShowParams;

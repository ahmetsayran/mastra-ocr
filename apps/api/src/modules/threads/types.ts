import type { Static } from 'elysia';
import {
  threadAttachmentDto,
  threadCreateDto,
  threadIndexDto,
  threadDetailResponseDto,
  threadMessageDto,
  threadMessageResponseDto,
  threadResponseDto,
  threadUpdateDto,
} from './dtos';

export type ThreadIndexQuery = Static<(typeof threadIndexDto)['query']>;
export type ThreadCreatePayload = Static<(typeof threadCreateDto)['body']>;
export type ThreadUpdatePayload = Static<(typeof threadUpdateDto)['body']>;
export type ThreadMessagePayload = Static<(typeof threadMessageDto)['body']>;
export type ThreadAttachmentPayload = Static<(typeof threadAttachmentDto)['body']>;
export type ThreadShowResponse = Static<typeof threadResponseDto>;
export type ThreadMessageResponse = Static<typeof threadMessageResponseDto>;
export type ThreadDetailResponse = Static<typeof threadDetailResponseDto>;

import type { Static } from 'elysia';
import {
  threadCreateDto,
  threadDetailResponseDto,
  threadMessageDto,
  threadResponseDto,
  threadUpdateDto,
} from './dtos';

export type ThreadCreatePayload = Static<(typeof threadCreateDto)['body']>;
export type ThreadUpdatePayload = Static<(typeof threadUpdateDto)['body']>;
export type ThreadMessagePayload = Static<(typeof threadMessageDto)['body']>;
export type ThreadShowResponse = Static<typeof threadResponseDto>;
export type ThreadDetailResponse = Static<typeof threadDetailResponseDto>;

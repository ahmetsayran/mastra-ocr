import type { Static } from 'elysia';
import {
  threadCreateDto,
  threadDetailResponseDto,
  threadMessageDto,
  threadResponseDto,
} from './dtos';

export type ThreadCreatePayload = Static<(typeof threadCreateDto)['body']>;
export type ThreadMessagePayload = Static<(typeof threadMessageDto)['body']>;
export type ThreadShowResponse = Static<typeof threadResponseDto>;
export type ThreadDetailResponse = Static<typeof threadDetailResponseDto>;

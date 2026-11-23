import type { Static } from 'elysia';
import {
  chatThreadCreateDto,
  chatThreadDetailResponseDto,
  chatThreadMessageDto,
  chatThreadResponseDto,
} from './dtos';

export type ChatThreadCreatePayload = Static<(typeof chatThreadCreateDto)['body']>;
export type ChatThreadMessagePayload = Static<(typeof chatThreadMessageDto)['body']>;
export type ChatThreadShowResponse = Static<typeof chatThreadResponseDto>;
export type ChatThreadDetailResponse = Static<typeof chatThreadDetailResponseDto>;

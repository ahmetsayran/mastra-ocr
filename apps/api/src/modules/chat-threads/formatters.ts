import type { ChatMessage, ChatThread } from '@onlyjs/db/client';
import { BaseFormatter } from '../../utils/base-formatter';
import { chatThreadDetailResponseDto, chatThreadResponseDto } from './dtos';
import type { ChatThreadDetailResponse, ChatThreadShowResponse } from './types';

export abstract class ChatThreadFormatter {
  static response(data: ChatThread) {
    return BaseFormatter.convertData<ChatThreadShowResponse>(data, chatThreadResponseDto);
  }

  static detail(data: ChatThread & { messages: ChatMessage[] }) {
    return BaseFormatter.convertData<ChatThreadDetailResponse>(data, chatThreadDetailResponseDto);
  }
}

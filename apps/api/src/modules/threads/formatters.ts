import type { ChatMessage, Thread } from '@onlyjs/db/client';
import { BaseFormatter } from '../../utils/base-formatter';
import { threadDetailResponseDto, threadResponseDto } from './dtos';
import type { ThreadDetailResponse, ThreadShowResponse } from './types';

export abstract class ThreadFormatter {
  static response(data: Thread) {
    return BaseFormatter.convertData<ThreadShowResponse>(data, threadResponseDto);
  }

  static detail(data: Thread & { messages: ChatMessage[] }) {
    return BaseFormatter.convertData<ThreadDetailResponse>(data, threadDetailResponseDto);
  }
}

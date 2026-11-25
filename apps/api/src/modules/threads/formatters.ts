import type { ChatMessage, Thread } from '@onlyjs/db/client';
import { BaseFormatter } from '../../utils/base-formatter';
import { threadDetailResponseDto, threadResponseDto } from './dtos';
import type { ThreadDetailResponse, ThreadShowResponse } from './types';

export abstract class ThreadFormatter {
  static response(data: Thread) {
    const convertedData = BaseFormatter.convertData<ThreadShowResponse>(data, threadResponseDto);
    return convertedData;
  }

  static detail(data: Thread & { messages: ChatMessage[] }) {
    const convertedData = BaseFormatter.convertData<ThreadDetailResponse>(
      data,
      threadDetailResponseDto,
    );
    return convertedData;
  }
}

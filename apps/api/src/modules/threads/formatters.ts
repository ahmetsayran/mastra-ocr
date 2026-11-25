import type { ChatMessage, Thread } from '@onlyjs/db/client';
import { BaseFormatter } from '../../utils/base-formatter';
import { threadDetailResponseDto, threadMessageResponseDto, threadResponseDto } from './dtos';
import type { ThreadDetailResponse, ThreadMessageResponse, ThreadShowResponse } from './types';

export abstract class ThreadFormatter {
  static response(data: Thread) {
    const convertedData = BaseFormatter.convertData<ThreadShowResponse>(data, threadResponseDto);
    return convertedData;
  }

  static message(
    data: ChatMessage & { asset: { uuid: string; name: string; title: string | null } | null },
  ) {
    const convertedData = BaseFormatter.convertData<ThreadMessageResponse>(
      data,
      threadMessageResponseDto,
    );
    return convertedData;
  }

  static detail(
    data: Thread & {
      messages: (ChatMessage & {
        asset: { uuid: string; name: string; title: string | null } | null;
      })[];
    },
  ) {
    const convertedData = BaseFormatter.convertData<ThreadDetailResponse>(
      data,
      threadDetailResponseDto,
    );
    return convertedData;
  }
}

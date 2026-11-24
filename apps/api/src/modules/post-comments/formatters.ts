import type { PostComment } from '@onlyjs/db/client';
import { BaseFormatter } from '../../utils/base-formatter';
import { postCommentResponseDto } from './dtos';
import type { PostCommentShowResponse } from './types';

export abstract class PostCommentFormatter {
  static response(data: PostComment & { author: { id: string; name: string } }) {
    const convertedData = BaseFormatter.convertData<PostCommentShowResponse>(
      {
        ...data,
        author: {
          id: data.author.id,
          name: data.author.name,
        },
      },
      postCommentResponseDto,
    );
    return convertedData;
  }
}

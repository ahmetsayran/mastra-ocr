import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { AuditLogAction, AuditLogEntity, AuditLogService } from '../../modules/audit-logs';
import { ensureUserHasPermission, PERMISSIONS } from '../../modules/auth';
import { PostCommentFormatter, PostCommentsService } from '../../modules/post-comments';

// Tools call the same service as the post-comments controller; userId comes from requestContext
const requestContextSchema = z.object({ userId: z.string() });

export const listPostCommentsTool = createTool({
  id: 'list-post-comments',
  description: 'Bir gönderinin yorumlarını listeler',
  inputSchema: z.object({ postUuid: z.string().uuid() }),
  execute: async ({ postUuid }) => {
    const { data } = await PostCommentsService.index({ postUuid });
    return data.map(PostCommentFormatter.response);
  },
});

export const createPostCommentTool = createTool({
  id: 'create-post-comment',
  description: 'Bir gönderiye yorum ekler',
  inputSchema: z.object({ postUuid: z.string().uuid(), content: z.string().min(1) }),
  requestContextSchema,
  execute: async (input, { requestContext }) => {
    const userId = requestContext.get('userId');
    await ensureUserHasPermission({ id: userId }, PERMISSIONS.POST_COMMENTS.CREATE);

    const comment = await PostCommentsService.store(input, userId);
    await AuditLogService.create({
      userId,
      actionType: AuditLogAction.CREATE,
      entityType: AuditLogEntity.POST_COMMENT,
      entityUuid: comment.uuid,
      description: 'Gönderiye yorum eklendi',
    });
    return PostCommentFormatter.response(comment);
  },
});

export const updatePostCommentTool = createTool({
  id: 'update-post-comment',
  description: 'Bir yorumun içeriğini günceller',
  inputSchema: z.object({ uuid: z.string().uuid(), content: z.string().min(1) }),
  requestContextSchema,
  execute: async ({ uuid, content }, { requestContext }) => {
    const userId = requestContext.get('userId');
    await ensureUserHasPermission({ id: userId }, PERMISSIONS.POST_COMMENTS.UPDATE);

    const comment = await PostCommentsService.update(uuid, { content });
    await AuditLogService.create({
      userId,
      actionType: AuditLogAction.UPDATE,
      entityType: AuditLogEntity.POST_COMMENT,
      entityUuid: uuid,
      description: 'Yorum güncellendi: content',
      metadata: { updatedFields: { content } },
    });
    return PostCommentFormatter.response(comment);
  },
});

export const deletePostCommentTool = createTool({
  id: 'delete-post-comment',
  description: 'Bir yorumu siler',
  inputSchema: z.object({ uuid: z.string().uuid() }),
  requestContextSchema,
  execute: async ({ uuid }, { requestContext }) => {
    const userId = requestContext.get('userId');
    await ensureUserHasPermission({ id: userId }, PERMISSIONS.POST_COMMENTS.DESTROY);

    await PostCommentsService.destroy(uuid);
    await AuditLogService.create({
      userId,
      actionType: AuditLogAction.DELETE,
      entityType: AuditLogEntity.POST_COMMENT,
      entityUuid: uuid,
      description: 'Yorum silindi',
    });
    return { message: 'Yorum başarıyla silindi' };
  },
});

export const postCommentTools = {
  listPostCommentsTool,
  createPostCommentTool,
  updatePostCommentTool,
  deletePostCommentTool,
};

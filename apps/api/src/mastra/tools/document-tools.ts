import { type FileLibraryAsset, FileLibraryAssetType } from '@onlyjs/db/client';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { AuditLogAction, AuditLogEntity, AuditLogService } from '../../modules/audit-logs';
import { ensureUserHasPermission, PERMISSIONS } from '../../modules/auth';
import { FileLibraryAssetsService } from '../../modules/file-library-assets';
import { OcrService } from '../../modules/file-library-assets/services/ocr.service';

// Tools call the same services as the file-library-assets controller; userId comes from requestContext
const requestContextSchema = z.object({ userId: z.string() });

export const listDocumentsTool = createTool({
  id: 'list-documents',
  description: 'Yüklenen OCR belgelerini en yeniden eskiye listeler',
  inputSchema: z.object({}),
  requestContextSchema,
  execute: async (_input, { requestContext }) => {
    const userId = requestContext.get('userId');
    await ensureUserHasPermission({ id: userId }, PERMISSIONS.FILE_LIBRARY_ASSETS.SHOW);

    const { data } = await FileLibraryAssetsService.index({
      type: FileLibraryAssetType.OCR_DOCUMENT,
    });
    return data.map((asset: FileLibraryAsset) => ({
      uuid: asset.uuid,
      name: asset.title ?? asset.name,
      createdAt: asset.createdAt,
    }));
  },
});

export const summarizeDocumentTool = createTool({
  id: 'summarize-document',
  description: 'Bir OCR belgesinin özetini çıkarır ve belgenin kaydına yazar',
  inputSchema: z.object({ uuid: z.string().uuid() }),
  requestContextSchema,
  execute: async ({ uuid }, { requestContext }) => {
    const userId = requestContext.get('userId');
    await ensureUserHasPermission({ id: userId }, PERMISSIONS.FILE_LIBRARY_ASSETS.UPDATE);

    const asset = (await OcrService.summarize(uuid)) as {
      name: string;
      title: string | null;
      metadata: { summary?: string } | null;
    };
    await AuditLogService.create({
      userId,
      actionType: AuditLogAction.UPDATE,
      entityType: AuditLogEntity.FILE_LIBRARY_ASSET,
      entityUuid: uuid,
      description: 'OCR ile belge özeti çıkarıldı',
    });
    return { name: asset.title ?? asset.name, summary: asset.metadata?.summary };
  },
});

export const documentTools = {
  listDocumentsTool,
  summarizeDocumentTool,
};

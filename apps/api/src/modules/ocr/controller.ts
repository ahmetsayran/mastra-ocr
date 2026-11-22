import { Elysia } from 'elysia';
import { dtoWithMiddlewares } from '../../utils';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../audit-logs';
import { auth, PERMISSIONS, withPermission } from '../auth';
import { ocrReadDto } from './dtos';
import { OcrService } from './service';

const ocrController = new Elysia({ prefix: '/ocr', tags: ['OCR'] }).use(auth()).post(
  '/:uuid',
  async ({ params }) => OcrService.read(params.uuid),
  dtoWithMiddlewares(
    ocrReadDto,
    withPermission(PERMISSIONS.FILE_LIBRARY_ASSETS.UPDATE),
    withAuditLog({
      actionType: AuditLogAction.UPDATE,
      entityType: AuditLogEntity.FILE_LIBRARY_ASSET,
      getEntityUuid: ({ params }) => params.uuid!,
      getDescription: () => 'OCR ile metin okundu',
    }),
  ),
);

export default ocrController;

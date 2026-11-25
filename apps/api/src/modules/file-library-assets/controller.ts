import { Elysia } from 'elysia';
import { dtoWithMiddlewares, NotFoundException } from '../../utils';
import { PaginationService } from '../../utils/pagination';
import { AuditLogAction, AuditLogEntity, withAuditLog } from '../audit-logs';
import { auth, dtoWithPermission, PERMISSIONS, withPermission } from '../auth';
import {
  fileLibraryAssetCreateDto,
  fileLibraryAssetDestroyDto,
  fileLibraryAssetExtractDto,
  fileLibraryAssetExtractionUpdateDto,
  fileLibraryAssetIndexDto,
  fileLibraryAssetOcrDto,
  fileLibraryAssetShowDto,
  fileLibraryAssetSummaryDto,
  fileLibraryAssetUpdateDto,
} from './dtos';
import { FileLibraryAssetFormatter } from './formatters';
import { withDocumentIndexing } from './middleware';
import { FileLibraryAssetsService } from './service';
import { OcrService } from './services/ocr.service';

const fileLibraryAssetsController = new Elysia({
  tags: ['FileLibraryAsset'],
})
  .use(auth())
  .get(
    '/',
    async ({ query }) => {
      const { data, total } = await FileLibraryAssetsService.index(query);
      return PaginationService.createPaginatedResponse({
        data,
        total,
        query,
        formatter: FileLibraryAssetFormatter.response,
      });
    },
    dtoWithPermission(fileLibraryAssetIndexDto, PERMISSIONS.FILE_LIBRARY_ASSETS.SHOW),
  )
  .get(
    '/:uuid',
    async ({ params }) => {
      const fileLibraryAsset = await FileLibraryAssetsService.show(params.uuid);
      if (!fileLibraryAsset) throw new NotFoundException('Dosya bulunamadı');
      return FileLibraryAssetFormatter.response(fileLibraryAsset);
    },
    dtoWithPermission(fileLibraryAssetShowDto, PERMISSIONS.FILE_LIBRARY_ASSETS.SHOW),
  )
  .post(
    '/',
    async ({ body }) => {
      const fileLibraryAsset = await FileLibraryAssetsService.store(body);
      return FileLibraryAssetFormatter.response(fileLibraryAsset);
    },
    dtoWithMiddlewares(
      fileLibraryAssetCreateDto,
      withPermission(PERMISSIONS.FILE_LIBRARY_ASSETS.CREATE),
      withAuditLog({
        actionType: AuditLogAction.CREATE,
        entityType: AuditLogEntity.FILE_LIBRARY_ASSET,
        getEntityUuid: (ctx) => {
          // @ts-ignore // TODO: fix this
          const response = ctx.response as ReturnType<typeof FileLibraryAssetFormatter.response>;
          return response.uuid;
        },
        getDescription: () => {
          return 'Yeni dosya oluşturuldu';
        },
      }),
      withDocumentIndexing(),
    ),
  )
  .put(
    '/:uuid',
    async ({ params, body }) => {
      const fileLibraryAsset = await FileLibraryAssetsService.update(params.uuid, body);
      if (!fileLibraryAsset) throw new NotFoundException('Dosya bulunamadı');
      return FileLibraryAssetFormatter.response(fileLibraryAsset);
    },
    dtoWithMiddlewares(
      fileLibraryAssetUpdateDto,
      withPermission(PERMISSIONS.FILE_LIBRARY_ASSETS.UPDATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.FILE_LIBRARY_ASSET,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: ({ body }) => {
          return `Dosya güncellendi: ${Object.keys(body as object).join(', ')}`;
        },
        getMetadata: ({ body }) => {
          return { updatedFields: body };
        },
      }),
    ),
  )
  .delete(
    '/:uuid',
    async ({ params }) => {
      const fileLibraryAsset = await FileLibraryAssetsService.destroy(params.uuid);
      if (!fileLibraryAsset) throw new NotFoundException('Dosya bulunamadı');
      return { message: 'Dosya başarıyla silindi' };
    },
    dtoWithMiddlewares(
      fileLibraryAssetDestroyDto,
      withPermission(PERMISSIONS.FILE_LIBRARY_ASSETS.DESTROY),
      withAuditLog({
        actionType: AuditLogAction.DELETE,
        entityType: AuditLogEntity.FILE_LIBRARY_ASSET,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => {
          return 'Dosya silindi';
        },
      }),
    ),
  );

const fileLibraryAssetOcrController = new Elysia({
  tags: ['FileLibraryAsset'],
})
  .use(auth())
  .post(
    '/:uuid/ocr',
    async ({ params }) => OcrService.read(params.uuid),
    dtoWithMiddlewares(
      fileLibraryAssetOcrDto,
      withPermission(PERMISSIONS.FILE_LIBRARY_ASSETS.UPDATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.FILE_LIBRARY_ASSET,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => {
          return 'OCR ile metin okundu';
        },
      }),
    ),
  )
  .post(
    '/:uuid/extract',
    async ({ params }) => OcrService.extract(params.uuid),
    dtoWithMiddlewares(
      fileLibraryAssetExtractDto,
      withPermission(PERMISSIONS.FILE_LIBRARY_ASSETS.UPDATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.FILE_LIBRARY_ASSET,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => {
          return 'OCR ile fatura bilgileri ayıklandı';
        },
      }),
    ),
  )
  .put(
    '/:uuid/extraction',
    async ({ params, body }) => OcrService.updateExtraction(params.uuid, body),
    dtoWithMiddlewares(
      fileLibraryAssetExtractionUpdateDto,
      withPermission(PERMISSIONS.FILE_LIBRARY_ASSETS.UPDATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.FILE_LIBRARY_ASSET,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => {
          return 'Ayıklanan bilgiler elle düzeltildi';
        },
      }),
    ),
  )
  .post(
    '/:uuid/summary',
    async ({ params }) => OcrService.summarize(params.uuid),
    dtoWithMiddlewares(
      fileLibraryAssetSummaryDto,
      withPermission(PERMISSIONS.FILE_LIBRARY_ASSETS.UPDATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.FILE_LIBRARY_ASSET,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => {
          return 'OCR ile belge özeti çıkarıldı';
        },
      }),
    ),
  );

const app = new Elysia({
  prefix: '/file-library-assets',
})
  // add other file library related controllers here
  .use(fileLibraryAssetsController)
  .use(fileLibraryAssetOcrController);

export default app;

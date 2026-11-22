import { t } from 'elysia';
import { type ControllerHook, errorResponseDto, uuidValidation } from '../../utils';
import { fileLibraryAssetResponseDto } from '../file-library-assets';

export const ocrReadDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: {
    200: fileLibraryAssetResponseDto,
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: 'Read',
    description: 'Yüklenmiş OCR belgesindeki metni okur',
  },
} satisfies ControllerHook;

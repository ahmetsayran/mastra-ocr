import { t } from 'elysia';
import { type ControllerHook, errorResponseDto } from '../../utils';
import { FILE_LIBRARY_ASSET_IMAGE_RULES } from '../file-library-assets';

export const OCR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const ocrReadInputDto = t.Object({
  file: t.File({
    type: [...OCR_ALLOWED_MIME_TYPES],
    maxSize: FILE_LIBRARY_ASSET_IMAGE_RULES.maxSize,
  }),
});

export const ocrReadResponseDto = t.Object({
  text: t.String(),
});

export const ocrReadDto = {
  body: ocrReadInputDto,
  response: { 200: ocrReadResponseDto, 422: errorResponseDto[422] },
  detail: {
    summary: 'Read',
    description: 'Görseldeki metni okur',
  },
} satisfies ControllerHook;

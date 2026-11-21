import { t } from 'elysia';
import { type ControllerHook, errorResponseDto, uuidValidation } from '../../utils';

export const ocrReadResponseDto = t.Object({
  uuid: t.String(),
  text: t.String(),
});

export const ocrReadDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: ocrReadResponseDto, 404: errorResponseDto[404], 422: errorResponseDto[422] },
  detail: {
    summary: 'Read',
    description: 'Yüklenmiş OCR belgesindeki metni okur',
  },
} satisfies ControllerHook;

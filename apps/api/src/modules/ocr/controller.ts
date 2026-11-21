import { Elysia } from 'elysia';
import { auth } from '../auth';
import { ocrReadDto } from './dtos';
import { OcrService } from './service';

const ocrController = new Elysia({ prefix: '/ocr', tags: ['OCR'] })
  .use(auth())
  .post('/', async ({ body }) => OcrService.read(body.file), ocrReadDto);

export default ocrController;

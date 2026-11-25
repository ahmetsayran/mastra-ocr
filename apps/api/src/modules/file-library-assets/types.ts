import type { Static } from 'elysia';
import type { z } from 'zod';

import {
  FILE_LIBRARY_ASSET_OCR_DOCUMENT_TYPES,
  FILE_LIBRARY_ASSET_OCR_EXTRACTORS,
} from './constants';
import {
  fileLibraryAssetCreateInputDto,
  fileLibraryAssetIndexDto,
  fileLibraryAssetResponseDto,
  fileLibraryAssetShowDto,
  fileLibraryAssetUpdateInputDto,
} from './dtos';

export type FileLibraryAssetShowParams = Static<(typeof fileLibraryAssetShowDto)['params']>;
export type FileLibraryAssetShowResponse = Static<typeof fileLibraryAssetResponseDto>;
export type FileLibraryAssetDestroyParams = FileLibraryAssetShowParams;

export type FileLibraryAssetCreateInput = Static<typeof fileLibraryAssetCreateInputDto>;
export type FileLibraryAssetUpdateInput = Static<typeof fileLibraryAssetUpdateInputDto>;

export type FileLibraryAssetIndexQuery = Static<typeof fileLibraryAssetIndexDto.query>;

export type FileLibraryAssetOcrDocumentType =
  (typeof FILE_LIBRARY_ASSET_OCR_DOCUMENT_TYPES)[number];
export type FileLibraryAssetOcrExtraction = z.infer<
  (typeof FILE_LIBRARY_ASSET_OCR_EXTRACTORS)[FileLibraryAssetOcrDocumentType]['schema']
>;

import {
    FileLibraryAssetMimeType,
    FileLibraryAssetType,
} from '@onlyjs/db/client';
import { z } from 'zod';

export const FILE_LIBRARY_ASSET_IMAGE_RULES = {
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
  ],
  maxSize: 10 * 1024 * 1024, // 10MB
};

export const FILE_LIBRARY_ASSET_VIDEO_RULES = {
  allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mpeg', 'video/webm', 'video/ogg'],
  maxSize: 10 * 1024 * 1024, // 10MB
};

export const FILE_LIBRARY_ASSET_DOCUMENT_RULES = {
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  maxSize: 50 * 1024 * 1024, // 50MB
};

export const FILE_LIBRARY_ASSET_OCR_DOCUMENT_RULES = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: 10 * 1024 * 1024, // 10MB
};

export const FILE_LIBRARY_ASSET_OCR_INVOICE_SCHEMA = z.object({
  invoiceNumber: z.string().nullable().describe('Fatura numarası'),
  invoiceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .describe('Fatura tarihi, YYYY-MM-DD'),
  sellerName: z.string().nullable().describe('Satıcı firma veya kişi adı'),
  buyerName: z.string().nullable().describe('Alıcı firma veya kişi adı'),
  subtotal: z.number().nonnegative().nullable().describe('KDV hariç ara toplam'),
  taxAmount: z.number().nonnegative().nullable().describe('KDV tutarı'),
  totalAmount: z.number().nonnegative().nullable().describe('Genel toplam, ödenecek tutar'),
  currency: z.string().length(3).nullable().describe('Para birimi kodu, örnek TRY'),
});

export const FILE_LIBRARY_ASSET_RAG_CHUNK_SIZE = 1000; // characters
export const FILE_LIBRARY_ASSET_RAG_SEARCH_LIMIT = 3;

export const FILE_LIBRARY_ASSET_TYPE_RULES = {
  //PRODUCT_IMAGE
  [FileLibraryAssetType.PRODUCT_IMAGE]: {
    validationRules: FILE_LIBRARY_ASSET_IMAGE_RULES,
    pathPrefix: ['products', 'images'],
  },
  //USER_IMAGE
  [FileLibraryAssetType.USER_IMAGE]: {
    validationRules: FILE_LIBRARY_ASSET_IMAGE_RULES,
    pathPrefix: ['users', 'images'],
  },
  //SCHOOL_LOGO
  [FileLibraryAssetType.SCHOOL_LOGO]: {
    validationRules: FILE_LIBRARY_ASSET_IMAGE_RULES,
    pathPrefix: ['schools', 'logos'],
  },
  //PRODUCT_BRAND_LOGO
  [FileLibraryAssetType.PRODUCT_BRAND_LOGO]: {
    validationRules: FILE_LIBRARY_ASSET_IMAGE_RULES,
    pathPrefix: ['product-brands', 'logos'],
  },
  //SCHOOL_BRAND_LOGO
  [FileLibraryAssetType.SCHOOL_BRAND_LOGO]: {
    validationRules: FILE_LIBRARY_ASSET_IMAGE_RULES,
    pathPrefix: ['school-brands', 'logos'],
  },
  //OCR_DOCUMENT
  [FileLibraryAssetType.OCR_DOCUMENT]: {
    validationRules: FILE_LIBRARY_ASSET_OCR_DOCUMENT_RULES,
    pathPrefix: ['ocr', 'documents'],
  },
};

export const normalizeMimeType = (mimeType: string) => {
  const mimeTypesMapping = {
    //IMAGE
    'image/jpeg': FileLibraryAssetMimeType.IMAGE_JPEG,
    'image/png': FileLibraryAssetMimeType.IMAGE_PNG,
    'image/gif': FileLibraryAssetMimeType.IMAGE_GIF,
    'image/webp': FileLibraryAssetMimeType.IMAGE_WEBP,
    'image/svg+xml': FileLibraryAssetMimeType.IMAGE_SVG,
    'image/bmp': FileLibraryAssetMimeType.IMAGE_BMP,
    'image/tiff': FileLibraryAssetMimeType.IMAGE_TIFF,

    //VIDEO
    'video/mp4': FileLibraryAssetMimeType.VIDEO_MP4,
    'video/avi': FileLibraryAssetMimeType.VIDEO_AVI,
    'video/mpeg': FileLibraryAssetMimeType.VIDEO_MPEG,
    'video/webm': FileLibraryAssetMimeType.VIDEO_WEBM,
    'video/ogg': FileLibraryAssetMimeType.VIDEO_OGG,

    //DOCUMENT
    'application/pdf': FileLibraryAssetMimeType.DOCUMENT_PDF,
    'application/msword': FileLibraryAssetMimeType.DOCUMENT_MSWORD,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      FileLibraryAssetMimeType.DOCUMENT_DOCX,
  };

  return mimeTypesMapping[mimeType as keyof typeof mimeTypesMapping];
};

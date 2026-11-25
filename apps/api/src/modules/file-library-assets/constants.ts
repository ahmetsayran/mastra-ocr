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
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSize: 10 * 1024 * 1024, // 10MB
};

// Scanned PDFs (no text layer) are read page by page as images; each page is one AI request
export const FILE_LIBRARY_ASSET_OCR_PDF_MAX_PAGES = 5;
export const FILE_LIBRARY_ASSET_OCR_PDF_RENDER_SCALE = 2;

export const FILE_LIBRARY_ASSET_OCR_READ_PROMPT = 'Bu görseldeki tüm metni oku ve aynen yaz.';

export const FILE_LIBRARY_ASSET_OCR_SUMMARY_PROMPT =
  'Bu belgeyi Türkçe olarak 3-5 cümleyle özetle. Belgenin türünü, kimden kime olduğunu ve önemli tutar, tarih ve bilgileri yaz.';

export const FILE_LIBRARY_ASSET_OCR_DOCUMENT_TYPES = [
  'invoice',
  'receipt',
  'contract',
  'id_card',
  'other',
] as const;

export const FILE_LIBRARY_ASSET_OCR_CLASSIFY_PROMPT =
  'Bu belgenin türünü belirle: invoice (fatura), receipt (fiş veya makbuz), ' +
  'contract (sözleşme), id_card (kimlik kartı, ehliyet veya pasaport), other (diğer).';

export const FILE_LIBRARY_ASSET_OCR_CLASSIFY_SCHEMA = z.object({
  documentType: z.enum(FILE_LIBRARY_ASSET_OCR_DOCUMENT_TYPES).describe('Belge türü'),
});

// Shared rules appended to every extraction prompt
const FILE_LIBRARY_ASSET_OCR_EXTRACT_RULES =
  'Tutarları noktasız ve virgülsüz düz sayı olarak yaz (örnek: "1.440,00 TL" → 1440). ' +
  'Tarihleri YYYY-MM-DD biçiminde yaz. Para birimini kod olarak yaz (TL → TRY). ' +
  'Belgede gerçekten olmayan bilgi için null yaz.';

// Product and service lines of invoices and receipts
const lineItems = z
  .array(
    z.object({
      description: z.string().describe('Ürün veya hizmet adı'),
      quantity: z.number().nonnegative().nullable().describe('Miktar'),
      unitPrice: z.number().nonnegative().nullable().describe('Birim fiyat'),
      total: z.number().nonnegative().nullable().describe('Satır tutarı'),
    }),
  )
  .describe('Ürün ve hizmet satırları');

const isoDate = (description: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .describe(`${description}, YYYY-MM-DD`);

// Extraction prompt and schema for each document type
export const FILE_LIBRARY_ASSET_OCR_EXTRACTORS = {
  invoice: {
    prompt:
      'Bu faturadaki bilgileri ayıkla. ' +
      'Belgede "Toplam", "Genel Toplam" veya "Ödenecek Tutar" yazan tutar genel toplamdır. ' +
      'Ara toplam KDV hariç tutardır; belgede "Ara Toplam" yazmıyorsa ürün ve hizmet satırlarındaki tutarların toplamını yaz. ' +
      FILE_LIBRARY_ASSET_OCR_EXTRACT_RULES,
    schema: z.object({
      invoiceNumber: z.string().nullable().describe('Fatura numarası'),
      invoiceDate: isoDate('Fatura tarihi'),
      sellerName: z.string().nullable().describe('Satıcı firma veya kişi adı'),
      buyerName: z.string().nullable().describe('Alıcı firma veya kişi adı'),
      subtotal: z.number().nonnegative().nullable().describe('KDV hariç ara toplam'),
      taxAmount: z.number().nonnegative().nullable().describe('KDV tutarı'),
      totalAmount: z.number().nonnegative().nullable().describe('Genel toplam, ödenecek tutar'),
      currency: z.string().length(3).nullable().describe('Para birimi kodu, örnek TRY'),
      lineItems,
    }),
  },
  receipt: {
    prompt: 'Bu fişteki veya makbuzdaki bilgileri ayıkla. ' + FILE_LIBRARY_ASSET_OCR_EXTRACT_RULES,
    schema: z.object({
      storeName: z.string().nullable().describe('Mağaza veya işletme adı'),
      receiptDate: isoDate('Fiş tarihi'),
      taxAmount: z.number().nonnegative().nullable().describe('KDV tutarı'),
      totalAmount: z.number().nonnegative().nullable().describe('Toplam tutar'),
      paymentMethod: z.string().nullable().describe('Ödeme şekli, örnek nakit veya kredi kartı'),
      currency: z.string().length(3).nullable().describe('Para birimi kodu, örnek TRY'),
      lineItems,
    }),
  },
  contract: {
    prompt: 'Bu sözleşmedeki bilgileri ayıkla. ' + FILE_LIBRARY_ASSET_OCR_EXTRACT_RULES,
    schema: z.object({
      contractTitle: z.string().nullable().describe('Sözleşmenin adı veya türü'),
      parties: z
        .array(z.string())
        .describe('Sözleşmenin tarafları, rolü ve adıyla (örnek: "Kiracı: Ali Yılmaz")'),
      startDate: isoDate('Başlangıç tarihi'),
      endDate: isoDate('Bitiş tarihi'),
      amount: z.number().nonnegative().nullable().describe('Sözleşme bedeli veya dönemlik ödeme'),
      currency: z.string().length(3).nullable().describe('Para birimi kodu, örnek TRY'),
      paymentTerms: z.string().nullable().describe('Ödeme koşulları'),
    }),
  },
  id_card: {
    prompt: 'Bu kimlik belgesindeki bilgileri ayıkla. ' + FILE_LIBRARY_ASSET_OCR_EXTRACT_RULES,
    schema: z.object({
      fullName: z.string().nullable().describe('Ad soyad'),
      idNumber: z.string().nullable().describe('Kimlik numarası'),
      birthDate: isoDate('Doğum tarihi'),
      nationality: z.string().nullable().describe('Uyruk'),
      documentNumber: z.string().nullable().describe('Belge veya seri numarası'),
      expiryDate: isoDate('Son geçerlilik tarihi'),
    }),
  },
  other: {
    prompt: 'Bu belgedeki temel bilgileri ayıkla. ' + FILE_LIBRARY_ASSET_OCR_EXTRACT_RULES,
    schema: z.object({
      title: z.string().nullable().describe('Belgenin başlığı'),
      documentDate: isoDate('Belgenin tarihi'),
      issuer: z.string().nullable().describe('Belgeyi düzenleyen kişi veya kurum'),
      keyPoints: z.array(z.string()).max(5).describe('Belgedeki en önemli bilgiler'),
    }),
  },
} as const;

// Amount difference allowed by validation checks (rounding on documents)
export const FILE_LIBRARY_ASSET_OCR_AMOUNT_TOLERANCE = 0.05;

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

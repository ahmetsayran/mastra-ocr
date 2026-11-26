import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table';
import { env } from '#/config/env';
import type { TranslationKey } from '#/config/translations';
import { useLanguage } from '#/context/language-context';
import { useEffect, useState } from 'react';
import type {
  FileLibraryAssetOcrDocumentType,
  FileLibraryAssetOcrValidationIssue,
  FileLibraryAssetShowResponse,
} from '#backend/modules/file-library-assets/types';
import {
  CircleAlert,
  CircleCheck,
  Download,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  NotebookText,
  Pencil,
  Receipt,
  RotateCw,
  ScanText,
} from 'lucide-react';
import { type ExtractionField, ExtractionForm } from './extraction-form';

interface FileViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: FileLibraryAssetShowResponse | null;
  onRead: (uuid: string) => Promise<void>;
  isReading: boolean;
  onExtract: (uuid: string) => Promise<void>;
  isExtracting: boolean;
  onSummarize: (uuid: string) => Promise<void>;
  isSummarizing: boolean;
  onIndex: (uuid: string) => Promise<void>;
  isIndexing: boolean;
  onUpdateExtraction: (uuid: string, extraction: Record<string, unknown>) => Promise<void>;
  isUpdatingExtraction: boolean;
}

// Fields shown for each document type, in the order of the API extraction schemas
const EXTRACTION_FIELDS: Record<FileLibraryAssetOcrDocumentType, ExtractionField[]> = {
  invoice: [
    { key: 'invoiceNumber', label: 'field.invoiceNumber', kind: 'text' },
    { key: 'invoiceDate', label: 'field.date', kind: 'date' },
    { key: 'sellerName', label: 'field.seller', kind: 'text' },
    { key: 'buyerName', label: 'field.buyer', kind: 'text' },
    { key: 'subtotal', label: 'field.subtotal', kind: 'number' },
    { key: 'taxAmount', label: 'field.vat', kind: 'number' },
    { key: 'totalAmount', label: 'field.total', kind: 'number' },
    { key: 'currency', label: 'field.currency', kind: 'text' },
  ],
  receipt: [
    { key: 'storeName', label: 'field.store', kind: 'text' },
    { key: 'receiptDate', label: 'field.date', kind: 'date' },
    { key: 'taxAmount', label: 'field.vat', kind: 'number' },
    { key: 'totalAmount', label: 'field.total', kind: 'number' },
    { key: 'paymentMethod', label: 'field.payment', kind: 'text' },
    { key: 'currency', label: 'field.currency', kind: 'text' },
  ],
  contract: [
    { key: 'contractTitle', label: 'field.contract', kind: 'text' },
    { key: 'parties', label: 'field.parties', kind: 'list' },
    { key: 'startDate', label: 'field.startDate', kind: 'date' },
    { key: 'endDate', label: 'field.endDate', kind: 'date' },
    { key: 'amount', label: 'field.amount', kind: 'number' },
    { key: 'currency', label: 'field.currency', kind: 'text' },
    { key: 'paymentTerms', label: 'field.paymentTerms', kind: 'text' },
  ],
  id_card: [
    { key: 'fullName', label: 'field.fullName', kind: 'text' },
    { key: 'idNumber', label: 'field.idNumber', kind: 'text' },
    { key: 'birthDate', label: 'field.birthDate', kind: 'date' },
    { key: 'nationality', label: 'field.nationality', kind: 'text' },
    { key: 'documentNumber', label: 'field.documentNumber', kind: 'text' },
    { key: 'expiryDate', label: 'field.expiryDate', kind: 'date' },
  ],
  other: [
    { key: 'title', label: 'common.title', kind: 'text' },
    { key: 'documentDate', label: 'field.date', kind: 'date' },
    { key: 'issuer', label: 'field.issuer', kind: 'text' },
    { key: 'keyPoints', label: 'field.keyPoints', kind: 'list' },
  ],
};

// The API client turns date-like strings (e.g. "2026-11-15") into Date objects
function formatExtractionValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  return String(value);
}

function formatValidationIssue(
  issue: FileLibraryAssetOcrValidationIssue,
  documentType: FileLibraryAssetOcrDocumentType,
  t: ReturnType<typeof useLanguage>['t'],
): string {
  const label: TranslationKey =
    EXTRACTION_FIELDS[documentType].find((field) => field.key === issue.field)?.label ??
    'field.date';

  return t(`validation.${issue.code}`, { ...issue, field: t(label) });
}

// Semicolons and a byte order mark let Excel with Turkish settings open the file with correct columns and letters
function toCsv(rows: string[][]): string {
  const quote = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  return `\uFEFF${rows.map((row) => row.map(quote).join(';')).join('\r\n')}`;
}

function formatFileSize(sizeStr: string): string {
  const bytes = parseInt(sizeStr, 10);
  if (isNaN(bytes)) return sizeStr;
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileTypeIcon(fileType: string) {
  switch (fileType) {
    case 'IMAGE':
      return <FileImage className="w-6 h-6 text-green-500" />;
    case 'VIDEO':
      return <FileVideo className="w-6 h-6 text-purple-500" />;
    case 'DOCUMENT':
      return <FileText className="w-6 h-6 text-blue-500" />;
    default:
      return <FileText className="w-6 h-6 text-muted-foreground" />;
  }
}

function getFileTypeBadgeVariant(fileType: string): string {
  switch (fileType) {
    case 'IMAGE':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'VIDEO':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'DOCUMENT':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return '';
  }
}

export function FileViewModal({
  open,
  onOpenChange,
  asset,
  onRead,
  isReading,
  onExtract,
  isExtracting,
  onSummarize,
  isSummarizing,
  onIndex,
  isIndexing,
  onUpdateExtraction,
  isUpdatingExtraction,
}: FileViewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { language, t } = useLanguage();

  // Editing closes when another document is opened
  useEffect(() => {
    setIsEditing(false);
  }, [asset?.uuid]);

  if (!asset) return null;

  const fileUrl = `${env.apiUrl}/storage/${asset.path}`;
  const isImage = asset.fileType === 'IMAGE';
  const isVideo = asset.fileType === 'VIDEO';
  const isPdf = asset.mimeType === 'DOCUMENT_PDF';
  const isOcrDocument = asset.type === 'OCR_DOCUMENT';
  const ocrText: string | undefined = asset.metadata?.text;
  const indexFailed: boolean = asset.metadata?.indexFailed === true;
  const documentType: FileLibraryAssetOcrDocumentType | undefined = asset.metadata?.documentType;
  const extraction: Record<string, unknown> | undefined = asset.metadata?.extraction;
  const lineItems: {
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    total: number | null;
  }[] = asset.metadata?.extraction?.lineItems ?? [];
  const validation: FileLibraryAssetOcrValidationIssue[] | undefined = asset.metadata?.validation;
  const summary: string | undefined = asset.metadata?.summary;

  const handleDownloadCsv = () => {
    if (!documentType || !extraction) return;

    const rows = [
      [t('field.field'), t('field.value')],
      [t('field.documentType'), t(`documentType.${documentType}`)],
      ...EXTRACTION_FIELDS[documentType].map((field) => [
        t(field.label),
        formatExtractionValue(extraction[field.key]),
      ]),
      ...(lineItems.length
        ? [
            [],
            [t('field.description'), t('field.quantity'), t('field.unitPrice'), t('field.total')],
            ...lineItems.map((item) => [
              item.description,
              formatExtractionValue(item.quantity),
              formatExtractionValue(item.unitPrice),
              formatExtractionValue(item.total),
            ]),
          ]
        : []),
    ];

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    link.download = `${(asset.title ?? asset.name).replace(/\.[^.]+$/, '')}-${t('file.csvName')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = asset.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            {getFileTypeIcon(asset.fileType)}
            <span className="truncate">{asset.title || asset.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Preview */}
          <div className="bg-muted rounded-lg overflow-hidden">
            {isImage ? (
              <img
                src={fileUrl}
                alt={asset.name}
                className="w-full h-auto max-h-[300px] object-contain"
              />
            ) : isVideo ? (
              <video
                src={fileUrl}
                controls
                className="w-full h-auto max-h-[300px]"
              >
                {t('file.videoNotSupported')}
              </video>
            ) : isPdf ? (
              <iframe src={fileUrl} title={asset.title ?? asset.name} className="w-full h-[300px]" />
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                {getFileTypeIcon(asset.fileType)}
                <span className="ml-2 text-muted-foreground">{t('file.previewNotAvailable')}</span>
              </div>
            )}
          </div>

          {/* File Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('file.filename')}</p>
              <p className="font-medium truncate" title={asset.name}>{asset.name}</p>
            </div>
            {asset.title && (
              <div>
                <p className="text-muted-foreground">{t('common.title')}</p>
                <p className="font-medium">{asset.title}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">{t('file.type')}</p>
              <Badge variant="outline" className="mt-1">
                {asset.type.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">{t('file.fileType')}</p>
              <Badge variant="secondary" className={`mt-1 ${getFileTypeBadgeVariant(asset.fileType)}`}>
                {asset.fileType}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">{t('file.mimeType')}</p>
              <p className="font-mono text-xs">{asset.mimeType.replace(/_/g, '/')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('file.size')}</p>
              <p className="font-medium">{formatFileSize(asset.size)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('file.created')}</p>
              <p className="font-medium">
                {new Date(asset.createdAt).toLocaleString(language)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('file.updated')}</p>
              <p className="font-medium">
                {new Date(asset.updatedAt).toLocaleString(language)}
              </p>
            </div>
          </div>

          {/* Chat search warning: background indexing failed, so chats cannot find this document */}
          {isOcrDocument && indexFailed && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 p-3 text-sm text-amber-600 dark:text-amber-400">
              <CircleAlert className="w-4 h-4 shrink-0" />
              <span className="flex-1">{t('file.indexWarning')}</span>
              <Button variant="outline" size="sm" onClick={() => onIndex(asset.uuid)} disabled={isIndexing}>
                {isIndexing ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    {t('file.indexing')}
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4 mr-2" />
                    {t('file.retryIndex')}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* OCR Text */}
          {isOcrDocument && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">{t('file.readText')}</p>
              {ocrText ? (
                <p className="bg-muted rounded-lg p-3 whitespace-pre-wrap break-words">{ocrText}</p>
              ) : (
                <p className="text-muted-foreground italic">{t('file.notRead')}</p>
              )}
            </div>
          )}

          {/* OCR Extracted Data */}
          {isOcrDocument && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1 flex items-center gap-2">
                {t('file.extractedData')}
                {documentType && <Badge variant="outline">{t(`documentType.${documentType}`)}</Badge>}
                {documentType && extraction && !isEditing && (
                  <span className="ml-auto flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7" onClick={handleDownloadCsv}>
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                      CSV
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => setIsEditing(true)}>
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      {t('file.edit')}
                    </Button>
                  </span>
                )}
              </p>
              {documentType && extraction && isEditing ? (
                <ExtractionForm
                  fields={EXTRACTION_FIELDS[documentType]}
                  extraction={extraction}
                  hasLineItems={documentType === 'invoice' || documentType === 'receipt'}
                  onSubmit={async (updatedExtraction) => {
                    await onUpdateExtraction(asset.uuid, updatedExtraction);
                    setIsEditing(false);
                  }}
                  onCancel={() => setIsEditing(false)}
                  isSaving={isUpdatingExtraction}
                />
              ) : documentType && extraction ? (
                <div className="grid grid-cols-2 gap-4 bg-muted rounded-lg p-3">
                  {EXTRACTION_FIELDS[documentType].map((field) => (
                    <div key={field.key}>
                      <p className="text-muted-foreground">{t(field.label)}</p>
                      <p className="font-medium break-words">
                        {formatExtractionValue(extraction[field.key])}
                      </p>
                    </div>
                  ))}
                  {lineItems.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">{t('field.lineItems')}</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('field.description')}</TableHead>
                            <TableHead className="text-right">{t('field.quantity')}</TableHead>
                            <TableHead className="text-right">{t('field.unitPrice')}</TableHead>
                            <TableHead className="text-right">{t('field.total')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineItems.map((item, index) => (
                            <TableRow key={`${item.description}-${index}`}>
                              <TableCell className="whitespace-normal">{item.description}</TableCell>
                              <TableCell className="text-right">
                                {formatExtractionValue(item.quantity)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatExtractionValue(item.unitPrice)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatExtractionValue(item.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {validation &&
                    (validation.length === 0 ? (
                      <p className="col-span-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CircleCheck className="w-4 h-4" />
                        {t('validation.passed')}
                      </p>
                    ) : (
                      <ul className="col-span-2 space-y-1 text-amber-600 dark:text-amber-400">
                        {validation.map((issue, index) => (
                          <li key={`${issue.code}-${index}`} className="flex items-start gap-2">
                            <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                            {formatValidationIssue(issue, documentType, t)}
                          </li>
                        ))}
                      </ul>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">{t('file.notExtracted')}</p>
              )}
            </div>
          )}

          {/* OCR Summary */}
          {isOcrDocument && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">{t('file.summary')}</p>
              {summary ? (
                <p className="bg-muted rounded-lg p-3 whitespace-pre-wrap break-words">{summary}</p>
              ) : (
                <p className="text-muted-foreground italic">{t('file.notSummarized')}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {isOcrDocument && (
            <Button variant="outline" size="sm" onClick={() => onRead(asset.uuid)} disabled={isReading}>
              {isReading ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  {t('file.reading')}
                </>
              ) : (
                <>
                  <ScanText className="w-4 h-4 mr-2" />
                  {t('file.readText')}
                </>
              )}
            </Button>
          )}
          {isOcrDocument && (
            <Button variant="outline" size="sm" onClick={() => onExtract(asset.uuid)} disabled={isExtracting}>
              {isExtracting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  {t('file.extracting')}
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  {t('file.extractData')}
                </>
              )}
            </Button>
          )}
          {isOcrDocument && (
            <Button variant="outline" size="sm" onClick={() => onSummarize(asset.uuid)} disabled={isSummarizing}>
              {isSummarizing ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  {t('file.summarizing')}
                </>
              ) : (
                <>
                  <NotebookText className="w-4 h-4 mr-2" />
                  {t('file.summarize')}
                </>
              )}
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('file.open')}
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              {t('file.download')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
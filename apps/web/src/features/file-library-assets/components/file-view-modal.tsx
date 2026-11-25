import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { env } from '#/config/env';
import type {
  FileLibraryAssetOcrDocumentType,
  FileLibraryAssetShowResponse,
} from '#backend/modules/file-library-assets/types';
import {
  Download,
  ExternalLink,
  FileImage,
  FileText,
  FileVideo,
  NotebookText,
  Receipt,
  ScanText,
} from 'lucide-react';

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
}

const DOCUMENT_TYPE_LABELS: Record<FileLibraryAssetOcrDocumentType, string> = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  contract: 'Contract',
  id_card: 'ID Card',
  other: 'Other',
};

// Fields shown for each document type, in the order of the API extraction schemas
const EXTRACTION_FIELDS: Record<FileLibraryAssetOcrDocumentType, { key: string; label: string }[]> = {
  invoice: [
    { key: 'invoiceNumber', label: 'Invoice No' },
    { key: 'invoiceDate', label: 'Date' },
    { key: 'sellerName', label: 'Seller' },
    { key: 'buyerName', label: 'Buyer' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'taxAmount', label: 'VAT' },
    { key: 'totalAmount', label: 'Total' },
    { key: 'currency', label: 'Currency' },
  ],
  receipt: [
    { key: 'storeName', label: 'Store' },
    { key: 'receiptDate', label: 'Date' },
    { key: 'taxAmount', label: 'VAT' },
    { key: 'totalAmount', label: 'Total' },
    { key: 'paymentMethod', label: 'Payment' },
    { key: 'currency', label: 'Currency' },
  ],
  contract: [
    { key: 'contractTitle', label: 'Contract' },
    { key: 'parties', label: 'Parties' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'currency', label: 'Currency' },
    { key: 'paymentTerms', label: 'Payment Terms' },
  ],
  id_card: [
    { key: 'fullName', label: 'Full Name' },
    { key: 'idNumber', label: 'ID Number' },
    { key: 'birthDate', label: 'Birth Date' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'documentNumber', label: 'Document No' },
    { key: 'expiryDate', label: 'Expiry Date' },
  ],
  other: [
    { key: 'title', label: 'Title' },
    { key: 'documentDate', label: 'Date' },
    { key: 'issuer', label: 'Issuer' },
    { key: 'keyPoints', label: 'Key Points' },
  ],
};

// The API client turns date-like strings (e.g. "2026-11-15") into Date objects
function formatExtractionValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  return String(value);
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
}: FileViewModalProps) {
  if (!asset) return null;

  const fileUrl = `${env.apiUrl}/storage/${asset.path}`;
  const isImage = asset.fileType === 'IMAGE';
  const isVideo = asset.fileType === 'VIDEO';
  const isPdf = asset.mimeType === 'DOCUMENT_PDF';
  const isOcrDocument = asset.type === 'OCR_DOCUMENT';
  const ocrText: string | undefined = asset.metadata?.text;
  const documentType: FileLibraryAssetOcrDocumentType | undefined = asset.metadata?.documentType;
  const extraction: Record<string, unknown> | undefined = asset.metadata?.extraction;
  const summary: string | undefined = asset.metadata?.summary;

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
                Your browser does not support the video tag.
              </video>
            ) : isPdf ? (
              <iframe src={fileUrl} title={asset.title ?? asset.name} className="w-full h-[300px]" />
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                {getFileTypeIcon(asset.fileType)}
                <span className="ml-2 text-muted-foreground">Preview not available</span>
              </div>
            )}
          </div>

          {/* File Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Filename</p>
              <p className="font-medium truncate" title={asset.name}>{asset.name}</p>
            </div>
            {asset.title && (
              <div>
                <p className="text-muted-foreground">Title</p>
                <p className="font-medium">{asset.title}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Type</p>
              <Badge variant="outline" className="mt-1">
                {asset.type.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">File Type</p>
              <Badge variant="secondary" className={`mt-1 ${getFileTypeBadgeVariant(asset.fileType)}`}>
                {asset.fileType}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">MIME Type</p>
              <p className="font-mono text-xs">{asset.mimeType.replace(/_/g, '/')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">{formatFileSize(asset.size)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(asset.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Updated</p>
              <p className="font-medium">
                {new Date(asset.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* OCR Text */}
          {isOcrDocument && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Read Text</p>
              {ocrText ? (
                <p className="bg-muted rounded-lg p-3 whitespace-pre-wrap break-words">{ocrText}</p>
              ) : (
                <p className="text-muted-foreground italic">Not read yet</p>
              )}
            </div>
          )}

          {/* OCR Extracted Data */}
          {isOcrDocument && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1 flex items-center gap-2">
                Extracted Data
                {documentType && <Badge variant="outline">{DOCUMENT_TYPE_LABELS[documentType]}</Badge>}
              </p>
              {documentType && extraction ? (
                <div className="grid grid-cols-2 gap-4 bg-muted rounded-lg p-3">
                  {EXTRACTION_FIELDS[documentType].map((field) => (
                    <div key={field.key}>
                      <p className="text-muted-foreground">{field.label}</p>
                      <p className="font-medium break-words">
                        {formatExtractionValue(extraction[field.key])}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Not extracted yet</p>
              )}
            </div>
          )}

          {/* OCR Summary */}
          {isOcrDocument && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Summary</p>
              {summary ? (
                <p className="bg-muted rounded-lg p-3 whitespace-pre-wrap break-words">{summary}</p>
              ) : (
                <p className="text-muted-foreground italic">Not summarized yet</p>
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
                  Reading...
                </>
              ) : (
                <>
                  <ScanText className="w-4 h-4 mr-2" />
                  Read Text
                </>
              )}
            </Button>
          )}
          {isOcrDocument && (
            <Button variant="outline" size="sm" onClick={() => onExtract(asset.uuid)} disabled={isExtracting}>
              {isExtracting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  Extracting...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Extract Data
                </>
              )}
            </Button>
          )}
          {isOcrDocument && (
            <Button variant="outline" size="sm" onClick={() => onSummarize(asset.uuid)} disabled={isSummarizing}>
              {isSummarizing ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  Summarizing...
                </>
              ) : (
                <>
                  <NotebookText className="w-4 h-4 mr-2" />
                  Summarize
                </>
              )}
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
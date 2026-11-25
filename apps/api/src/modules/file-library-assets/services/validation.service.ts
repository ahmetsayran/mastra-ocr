import { FILE_LIBRARY_ASSET_OCR_AMOUNT_TOLERANCE } from '../constants';
import type { FileLibraryAssetOcrDocumentType, FileLibraryAssetOcrValidationIssue } from '../types';

type LineItem = { quantity: number | null; unitPrice: number | null; total: number | null };
type Extraction = Record<string, unknown> & { lineItems?: LineItem[] };

export abstract class ValidationService {
  private static amount(value: unknown) {
    return typeof value === 'number' ? value : null;
  }

  private static differs(expected: number, actual: number) {
    return Math.abs(expected - actual) > FILE_LIBRARY_ASSET_OCR_AMOUNT_TOLERANCE;
  }

  private static checkDates(
    extraction: Extraction,
    fields: string[],
    pastOnlyFields: string[],
    issues: FileLibraryAssetOcrValidationIssue[],
  ) {
    const today = new Date().toISOString().slice(0, 10);

    for (const field of fields) {
      const value = extraction[field];
      if (typeof value !== 'string') continue;

      const date = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        issues.push({ code: 'INVALID_DATE', field });
      } else if (pastOnlyFields.includes(field) && value > today) {
        issues.push({ code: 'FUTURE_DATE', field });
      }
    }
  }

  private static checkLineItems(
    extraction: Extraction,
    expectedTotal: number | null,
    issues: FileLibraryAssetOcrValidationIssue[],
  ) {
    const lineItems = extraction.lineItems ?? [];

    lineItems.forEach((item, index) => {
      if (item.quantity !== null && item.unitPrice !== null && item.total !== null) {
        const expected = item.quantity * item.unitPrice;
        if (this.differs(expected, item.total)) {
          issues.push({
            code: 'LINE_TOTAL_MISMATCH',
            line: index + 1,
            expected,
            actual: item.total,
          });
        }
      }
    });

    const lineTotals = lineItems.map((item) => item.total);
    if (
      expectedTotal !== null &&
      lineTotals.length &&
      lineTotals.every((total) => total !== null)
    ) {
      const sum = (lineTotals as number[]).reduce((total, value) => total + value, 0);
      if (this.differs(expectedTotal, sum)) {
        issues.push({ code: 'LINE_ITEMS_MISMATCH', expected: expectedTotal, actual: sum });
      }
    }
  }

  // Official Turkish ID number rules: 11 digits, no leading zero, two check digits
  private static isValidTurkishIdNumber(value: string) {
    if (!/^[1-9]\d{10}$/.test(value)) return false;

    const digits = [...value].map(Number);
    const odd = digits[0]! + digits[2]! + digits[4]! + digits[6]! + digits[8]!;
    const even = digits[1]! + digits[3]! + digits[5]! + digits[7]!;
    const tenth = (((odd * 7 - even) % 10) + 10) % 10;
    const eleventh = digits.slice(0, 10).reduce((total, digit) => total + digit, 0) % 10;

    return digits[9] === tenth && digits[10] === eleventh;
  }

  static validate(documentType: FileLibraryAssetOcrDocumentType, data: unknown) {
    const extraction = data as Extraction;
    const issues: FileLibraryAssetOcrValidationIssue[] = [];

    if (documentType === 'invoice') {
      const subtotal = this.amount(extraction.subtotal);
      const taxAmount = this.amount(extraction.taxAmount);
      const totalAmount = this.amount(extraction.totalAmount);

      if (subtotal !== null && taxAmount !== null && totalAmount !== null) {
        if (this.differs(subtotal + taxAmount, totalAmount)) {
          issues.push({
            code: 'TOTAL_MISMATCH',
            expected: subtotal + taxAmount,
            actual: totalAmount,
          });
        }
      }
      this.checkLineItems(extraction, subtotal, issues);
      this.checkDates(extraction, ['invoiceDate'], ['invoiceDate'], issues);
    }

    if (documentType === 'receipt') {
      this.checkLineItems(extraction, this.amount(extraction.totalAmount), issues);
      this.checkDates(extraction, ['receiptDate'], ['receiptDate'], issues);
    }

    if (documentType === 'contract') {
      this.checkDates(extraction, ['startDate', 'endDate'], [], issues);
      const { startDate, endDate } = extraction;
      if (typeof startDate === 'string' && typeof endDate === 'string' && startDate > endDate) {
        issues.push({ code: 'DATE_ORDER', field: 'endDate' });
      }
    }

    if (documentType === 'id_card') {
      this.checkDates(extraction, ['birthDate', 'expiryDate'], ['birthDate'], issues);
      const { idNumber, expiryDate } = extraction;
      if (typeof idNumber === 'string' && !this.isValidTurkishIdNumber(idNumber)) {
        issues.push({ code: 'INVALID_ID_NUMBER', field: 'idNumber' });
      }
      if (typeof expiryDate === 'string' && expiryDate < new Date().toISOString().slice(0, 10)) {
        issues.push({ code: 'EXPIRED', field: 'expiryDate' });
      }
    }

    if (documentType === 'other') {
      this.checkDates(extraction, ['documentDate'], [], issues);
    }

    return issues;
  }
}

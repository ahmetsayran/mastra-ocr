import { describe, expect, it } from 'bun:test';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  describe('invoice', () => {
    const invoice = {
      invoiceDate: '2026-11-20',
      subtotal: 15500,
      taxAmount: 3100,
      totalAmount: 18600,
      lineItems: [
        { description: 'Kağıt', quantity: 10, unitPrice: 450, total: 4500 },
        { description: 'Toner', quantity: 4, unitPrice: 1250, total: 5000 },
        { description: 'Sandalye', quantity: 2, unitPrice: 3000, total: 6000 },
      ],
    };

    it('passes a consistent invoice', () => {
      expect(ValidationService.validate('invoice', invoice)).toEqual([]);
    });

    it('allows rounding differences within the tolerance', () => {
      expect(ValidationService.validate('invoice', { ...invoice, totalAmount: 18600.04 })).toEqual(
        [],
      );
    });

    it('reports a total that does not match subtotal + VAT', () => {
      expect(ValidationService.validate('invoice', { ...invoice, totalAmount: 18000 })).toEqual([
        { code: 'TOTAL_MISMATCH', expected: 18600, actual: 18000 },
      ]);
    });

    it('reports wrong line totals and their sum', () => {
      const lineItems = [...invoice.lineItems];
      lineItems[1] = { ...lineItems[1]!, total: 4000 };

      expect(ValidationService.validate('invoice', { ...invoice, lineItems })).toEqual([
        { code: 'LINE_TOTAL_MISMATCH', line: 2, expected: 5000, actual: 4000 },
        { code: 'LINE_ITEMS_MISMATCH', expected: 15500, actual: 14500 },
      ]);
    });

    it('reports invalid and future dates', () => {
      expect(
        ValidationService.validate('invoice', { ...invoice, invoiceDate: '2026-02-30' }),
      ).toEqual([{ code: 'INVALID_DATE', field: 'invoiceDate' }]);
      expect(
        ValidationService.validate('invoice', { ...invoice, invoiceDate: '2999-01-01' }),
      ).toEqual([{ code: 'FUTURE_DATE', field: 'invoiceDate' }]);
    });

    it('skips checks for missing values', () => {
      expect(ValidationService.validate('invoice', { invoiceDate: null, subtotal: null })).toEqual(
        [],
      );
    });
  });

  describe('receipt', () => {
    it('compares line items with the receipt total', () => {
      expect(
        ValidationService.validate('receipt', {
          totalAmount: 100,
          lineItems: [{ description: 'Çay', quantity: 2, unitPrice: 40, total: 80 }],
        }),
      ).toEqual([{ code: 'LINE_ITEMS_MISMATCH', expected: 100, actual: 80 }]);
    });
  });

  describe('contract', () => {
    it('reports an end date before the start date', () => {
      expect(
        ValidationService.validate('contract', { startDate: '2026-05-01', endDate: '2026-01-01' }),
      ).toEqual([{ code: 'DATE_ORDER', field: 'endDate' }]);
    });
  });

  describe('id_card', () => {
    it('passes a valid Turkish ID number', () => {
      expect(
        ValidationService.validate('id_card', {
          idNumber: '10000000146',
          expiryDate: '2999-01-01',
        }),
      ).toEqual([]);
    });

    it('reports a wrong check digit and an expired card', () => {
      expect(
        ValidationService.validate('id_card', {
          idNumber: '10000000145',
          expiryDate: '2000-01-01',
        }),
      ).toEqual([
        { code: 'INVALID_ID_NUMBER', field: 'idNumber' },
        { code: 'EXPIRED', field: 'expiryDate' },
      ]);
    });
  });
});

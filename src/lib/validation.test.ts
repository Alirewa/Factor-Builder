import { describe, it, expect } from 'vitest';
import { getInvoiceIssues } from './validation';
import { calculateTotals } from './utils';
import { InvoiceData, InvoiceItem } from '@/types/invoice';

const emptyParty = { name: '', company: '', address: '', phone: '', email: '', nationalId: '' };

function invoice(overrides: Partial<InvoiceData> = {}): InvoiceData {
  return {
    invoiceNumber: 'INV-1',
    invoiceDate: '2026-08-20',
    invoiceType: 'sale',
    seller: { ...emptyParty, company: 'فروشگاه پارس' },
    buyer: { ...emptyParty, name: 'مریم احمدی' },
    items: [],
    taxRate: 9,
    globalDiscount: 0,
    globalDiscountType: 'percent',
    notes: '',
    signature: { stampImage: null, signatureImage: null },
    customization: {
      primaryColor: '#1f2937',
      logoImage: null,
      fontSize: 'md',
      currency: 'rial',
      showTax: true,
      showDiscount: true,
      showNotes: true,
      showAmountInWords: true,
      showBismillah: true,
      template: 'store',
      showFooter: false,
      footerText: '',
    },
    ...overrides,
  };
}

function line(overrides: Partial<InvoiceItem> = {}): InvoiceItem {
  const quantity = overrides.quantity ?? 1;
  const unitPrice = overrides.unitPrice ?? 1000;
  return {
    id: 'x',
    name: 'کالا',
    unit: 'عدد',
    quantity,
    unitPrice,
    total: quantity * unitPrice,
    ...overrides,
  };
}

function check(inv: InvoiceData) {
  const totals = calculateTotals(inv.items, inv.taxRate, inv.globalDiscount, inv.globalDiscountType);
  return getInvoiceIssues(inv, totals);
}

describe('getInvoiceIssues', () => {
  it('blocks an invoice with no line items', () => {
    expect(check(invoice()).blocking).toContain('حداقل یک کالا یا خدمت به فاکتور اضافه کنید');
  });

  it('blocks when every line item is unnamed', () => {
    const issues = check(invoice({ items: [line({ name: '   ' })] }));
    expect(issues.blocking).toContain('برای اقلام فاکتور شرح وارد کنید');
  });

  it('blocks when the seller is unidentified', () => {
    const issues = check(invoice({ seller: emptyParty, items: [line()] }));
    expect(issues.blocking).toContain('نام فروشنده یا فروشگاه را وارد کنید');
  });

  it('accepts a minimally complete invoice', () => {
    expect(check(invoice({ items: [line()] })).blocking).toEqual([]);
  });

  it('treats a missing buyer as advisory, not blocking', () => {
    const issues = check(invoice({ buyer: emptyParty, items: [line()] }));
    expect(issues.blocking).toEqual([]);
    expect(issues.advisory).toContain('نام خریدار وارد نشده است');
  });

  it('counts partially filled rows as advisory', () => {
    const issues = check(invoice({ items: [line(), line({ name: '' })] }));
    expect(issues.blocking).toEqual([]);
    expect(issues.advisory).toContain('۱ ردیف بدون شرح است'.replace('۱', '1'));
  });

  it('flags priceless items and an empty invoice number', () => {
    const issues = check(invoice({ invoiceNumber: '', items: [line({ unitPrice: 0 })] }));
    expect(issues.advisory).toContain('بعضی اقلام قیمت ندارند');
    expect(issues.advisory).toContain('شماره فاکتور خالی است');
    expect(issues.advisory).toContain('مبلغ قابل پرداخت صفر است');
  });
});

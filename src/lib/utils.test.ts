import { describe, it, expect } from 'vitest';
import {
  calculateTotals,
  calculateItemTotal,
  numberToPersianWords,
  amountInWords,
  toCurrencyUnit,
  fromCurrencyUnit,
  toPersianDigits,
  formatPercent,
  discountLabel,
} from './utils';
import { InvoiceItem } from '@/types/invoice';

function item(partial: Partial<InvoiceItem> = {}): InvoiceItem {
  const quantity = partial.quantity ?? 1;
  const unitPrice = partial.unitPrice ?? 0;
  return {
    id: partial.id ?? Math.random().toString(36),
    name: partial.name ?? 'کالا',
    unit: partial.unit ?? 'عدد',
    quantity,
    unitPrice,
    total: quantity * unitPrice,
  };
}

describe('calculateTotals', () => {
  it('sums line items', () => {
    const totals = calculateTotals(
      [item({ quantity: 2, unitPrice: 1000 }), item({ quantity: 3, unitPrice: 500 })],
      0,
      0
    );
    expect(totals.subtotal).toBe(3500);
    expect(totals.total).toBe(3500);
  });

  it('applies a percentage discount before tax', () => {
    const totals = calculateTotals([item({ unitPrice: 1000 })], 10, 20, 'percent');
    expect(totals.globalDiscountAmount).toBe(200);
    // tax is charged on 800, not on 1000
    expect(totals.taxAmount).toBe(80);
    expect(totals.total).toBe(880);
  });

  it('applies a flat discount before tax', () => {
    const totals = calculateTotals([item({ unitPrice: 1000 })], 10, 250, 'fixed');
    expect(totals.globalDiscountAmount).toBe(250);
    expect(totals.taxAmount).toBe(75);
    expect(totals.total).toBe(825);
  });

  it('never lets a flat discount push the total negative', () => {
    const totals = calculateTotals([item({ unitPrice: 1000 })], 9, 999999, 'fixed');
    expect(totals.globalDiscountAmount).toBe(1000);
    expect(totals.total).toBe(0);
  });

  it('ignores a negative discount', () => {
    const totals = calculateTotals([item({ unitPrice: 1000 })], 0, -500, 'fixed');
    expect(totals.globalDiscountAmount).toBe(0);
    expect(totals.total).toBe(1000);
  });

  it('defaults to percentage when no discount type is given', () => {
    const totals = calculateTotals([item({ unitPrice: 1000 })], 0, 25);
    expect(totals.globalDiscountAmount).toBe(250);
  });

  it('handles an empty invoice', () => {
    const totals = calculateTotals([], 9, 10, 'percent');
    expect(totals).toEqual({
      subtotal: 0,
      globalDiscountAmount: 0,
      taxAmount: 0,
      total: 0,
    });
  });

  it('supports fractional quantities', () => {
    expect(calculateItemTotal({ name: 'سیم', quantity: 12.5, unitPrice: 120000 })).toBe(1500000);
  });
});

describe('currency conversion', () => {
  it('shows rial unchanged', () => {
    expect(toCurrencyUnit(150000, 'rial')).toBe(150000);
    expect(fromCurrencyUnit(150000, 'rial')).toBe(150000);
  });

  it('divides by ten for toman', () => {
    expect(toCurrencyUnit(150000, 'toman')).toBe(15000);
  });

  it('round-trips an amount typed in toman', () => {
    const typed = 100000;                                   // user types 100,000 تومان
    const stored = fromCurrencyUnit(typed, 'toman');        // stored as rial
    expect(stored).toBe(1000000);
    expect(toCurrencyUnit(stored, 'toman')).toBe(typed);    // displayed back as typed
  });
});

describe('numberToPersianWords', () => {
  it.each([
    [0, 'صفر'],
    [7, 'هفت'],
    [15, 'پانزده'],
    [42, 'چهل و دو'],
    [100, 'صد'],
    [305, 'سیصد و پنج'],
    [1000, 'یک هزار'],
    [1250000, 'یک میلیون و دویست و پنجاه هزار'],
  ])('converts %i', (input, expected) => {
    expect(numberToPersianWords(input)).toBe(expected);
  });

  it('handles the invoice total from the README example', () => {
    expect(numberToPersianWords(203009775)).toBe(
      'دویست و سه میلیون و نه هزار و هفتصد و هفتاد و پنج'
    );
  });

  it('rounds fractional amounts', () => {
    expect(numberToPersianWords(10.4)).toBe('ده');
    expect(numberToPersianWords(10.6)).toBe('یازده');
  });

  it('prefixes negatives', () => {
    expect(numberToPersianWords(-5)).toBe('منفی پنج');
  });

  it('appends the currency label', () => {
    expect(amountInWords(20000, 'toman')).toBe('دو هزار تومان');
    expect(amountInWords(20000, 'rial')).toBe('بیست هزار ریال');
  });
});

describe('formatting helpers', () => {
  it('converts latin digits to persian', () => {
    expect(toPersianDigits('1403-05')).toBe('۱۴۰۳-۰۵');
  });

  it('renders percentages with a persian sign', () => {
    expect(formatPercent(9)).toBe('۹٪');
  });

  it('labels a percentage discount as a percentage', () => {
    expect(discountLabel(15, 'percent', 'rial')).toBe('۱۵٪');
  });

  it('labels a flat discount with its currency, grouped with the persian separator', () => {
    // ٬ (ARABIC THOUSANDS SEPARATOR) — not a latin comma
    expect(discountLabel(500000, 'fixed', 'toman')).toBe('۵۰٬۰۰۰ تومان');
  });
});

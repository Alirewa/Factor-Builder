import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InvoiceItem, InvoiceTotals, CurrencyUnit, CURRENCY_LABELS, DiscountType } from '@/types/invoice';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
}

/** ریال ذخیره می‌شود؛ اگر واحد «تومان» باشد تقسیم بر ۱۰ می‌شود. */
export function toCurrencyUnit(amountInRial: number, currency: CurrencyUnit): number {
  return currency === 'toman' ? amountInRial / 10 : amountInRial;
}

/**
 * Inverse of toCurrencyUnit — converts an amount the user typed in the
 * displayed currency back into the rial that every amount is stored in.
 */
export function fromCurrencyUnit(amount: number, currency: CurrencyUnit): number {
  return currency === 'toman' ? amount * 10 : amount;
}

export function formatMoney(amountInRial: number, currency: CurrencyUnit): string {
  return formatCurrency(toCurrencyUnit(amountInRial, currency));
}

export function currencyLabel(currency: CurrencyUnit): string {
  return CURRENCY_LABELS[currency];
}

/** تعداد کالا با ارقام فارسی — تا ۳ رقم اعشار، بدون صفر اضافی */
export function formatQuantity(qty: number): string {
  if (!Number.isFinite(qty)) return '';
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 3 }).format(qty);
}

/** برچسب تخفیف — «۱۰٪» یا «مبلغ ثابت» */
export function discountLabel(
  value: number,
  type: DiscountType,
  currency: CurrencyUnit
): string {
  return type === 'fixed'
    ? `${formatMoney(value, currency)} ${currencyLabel(currency)}`
    : formatPercent(value);
}

/** درصد با ارقام فارسی — مثال: «۹٪» */
export function formatPercent(value: number): string {
  return `${toPersianDigits(new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value))}٪`;
}

export function calculateItemTotal(item: Omit<InvoiceItem, 'id' | 'total' | 'unit'>): number {
  return item.quantity * item.unitPrice;
}

export function calculateTotals(
  items: InvoiceItem[],
  taxRate: number,
  globalDiscount: number,
  globalDiscountType: DiscountType = 'percent'
): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  // A flat discount is stored in rial, the same unit as every other amount.
  // Clamp it so a discount larger than the subtotal can never produce a
  // negative total.
  const rawDiscount = globalDiscountType === 'fixed'
    ? globalDiscount
    : (subtotal * globalDiscount) / 100;
  const globalDiscountAmount = Math.min(Math.max(rawDiscount, 0), subtotal);

  const afterDiscount = subtotal - globalDiscountAmount;
  const taxAmount = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + taxAmount;

  return {
    subtotal,
    globalDiscountAmount,
    taxAmount,
    total,
  };
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `INV-${year}${month}${day}-${rand}`;
}

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function toJalali(date: string): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return date;
  }
}

/** ارقام لاتین را به ارقام فارسی تبدیل می‌کند (برای شماره فاکتور، تلفن، …) */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

// ─── مبلغ به حروف ────────────────────────────────────────────────────────────
const ONES     = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS    = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const TENS     = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const SCALES   = ['', ' هزار', ' میلیون', ' میلیارد', ' هزار میلیارد'];

/** عدد سه‌رقمی (۱ تا ۹۹۹) را به حروف فارسی برمی‌گرداند */
function tripletToWords(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;

  if (h > 0) parts.push(HUNDREDS[h]);

  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10]);
  } else {
    const t = Math.floor(rest / 10);
    const o = rest % 10;
    if (t > 0) parts.push(TENS[t]);
    if (o > 0) parts.push(ONES[o]);
  }

  return parts.join(' و ');
}

/**
 * عدد را به حروف فارسی تبدیل می‌کند — مثال: ۱۲۵۰۰۰۰ → «یک میلیون و دویست و پنجاه هزار»
 * اعداد اعشاری گرد می‌شوند و اعداد منفی با پیشوند «منفی» می‌آیند.
 */
export function numberToPersianWords(value: number): string {
  let n = Math.round(Math.abs(value));
  if (!Number.isFinite(n)) return '';
  if (n === 0) return 'صفر';

  const sign = value < 0 ? 'منفی ' : '';
  const groups: string[] = [];
  let scale = 0;

  while (n > 0 && scale < SCALES.length) {
    const triplet = n % 1000;
    if (triplet > 0) groups.unshift(tripletToWords(triplet) + SCALES[scale]);
    n = Math.floor(n / 1000);
    scale++;
  }

  return sign + groups.join(' و ');
}

/** «دو میلیون و پانصد هزار ریال» — آماده برای چاپ روی فاکتور */
export function amountInWords(amountInRial: number, currency: CurrencyUnit): string {
  const amount = toCurrencyUnit(amountInRial, currency);
  return `${numberToPersianWords(amount)} ${currencyLabel(currency)}`;
}

// ─── Assets ──────────────────────────────────────────────────────────────────
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  const maxSize = 2 * 1024 * 1024;
  if (!allowedTypes.includes(file.type)) return 'فرمت تصویر باید JPG، PNG، WEBP یا SVG باشد';
  if (file.size > maxSize) return 'حجم تصویر نباید بیشتر از ۲ مگابایت باشد';
  return null;
}

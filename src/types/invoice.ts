export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;        // واحد سنجش — عدد، کیلوگرم، متر، …
  unitPrice: number;
  total: number;
}

/** واحدهای رایج در فاکتورهای فروشگاهی — کاربر می‌تواند واحد دلخواه هم بنویسد */
export const UNIT_OPTIONS = [
  'عدد', 'دستگاه', 'جفت', 'بسته', 'کارتن', 'جعبه', 'رول', 'شاخه',
  'کیلوگرم', 'گرم', 'تن', 'لیتر', 'متر', 'متر مربع', 'متر مکعب',
  'ساعت', 'روز', 'ماه', 'سرویس', 'مورد',
] as const;

export const DEFAULT_UNIT = 'عدد';

export interface PartyInfo {
  name: string;
  company: string;
  address: string;
  phone: string;
  email: string;
  nationalId: string;
}

export interface InvoiceSignature {
  stampImage: string | null;
  signatureImage: string | null;
}

export type InvoiceTemplate = 'store' | 'formal' | 'corporate' | 'modern' | 'minimal';
export type ThemeMode = 'light' | 'dark';
export type InvoiceType = 'sale' | 'proforma';

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  sale:     'فاکتور فروش',
  proforma: 'پیش‌فاکتور',
};

/** عنوان رسمی که در سربرگ فاکتور چاپ می‌شود */
export const INVOICE_TYPE_TITLES: Record<InvoiceType, string> = {
  sale:     'صورتحساب فروش کالا و خدمات',
  proforma: 'پیش‌فاکتور فروش کالا و خدمات',
};

/** تخفیف کلی می‌تواند درصدی یا مبلغ ثابت باشد */
export type DiscountType = 'percent' | 'fixed';

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percent: 'درصدی',
  fixed:   'مبلغ ثابت',
};

export type CurrencyUnit = 'rial' | 'toman';

export const CURRENCY_LABELS: Record<CurrencyUnit, string> = {
  rial:  'ریال',
  toman: 'تومان',
};

export interface InvoiceCustomization {
  primaryColor: string;
  logoImage: string | null;   // lives here for template rendering
  fontSize: 'sm' | 'md' | 'lg';
  currency: CurrencyUnit;
  showTax: boolean;
  showDiscount: boolean;
  showNotes: boolean;
  showAmountInWords: boolean; // «مبلغ به حروف» — مرسوم در فاکتورهای ایرانی
  showBismillah: boolean;     // «بسمه تعالی» بالای برگه
  template: InvoiceTemplate;
  showFooter: boolean;
  footerText: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: InvoiceType;
  seller: PartyInfo;
  buyer: PartyInfo;
  items: InvoiceItem[];
  taxRate: number;
  /** Percentage (0–100) or a flat amount in rial, depending on globalDiscountType. */
  globalDiscount: number;
  globalDiscountType: DiscountType;
  notes: string;
  signature: InvoiceSignature;
  customization: InvoiceCustomization;
}

export interface InvoiceTotals {
  subtotal: number;
  globalDiscountAmount: number;
  taxAmount: number;
  total: number;
}

// ─── Seller profile (save/load seller info + assets) ──────────────────────────
export interface SavedProfile {
  id: string;
  name: string;
  seller: PartyInfo;
  stampImage: string | null;
  signatureImage: string | null;
  logoImage: string | null;
  primaryColor: string;
  createdAt: number;
}

// ─── Saved invoice (local invoice list, max 10) ───────────────────────────────
export interface SavedInvoice {
  id: string;
  label: string;              // auto: "شماره × — خریدار ×"
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: InvoiceType;
  buyerName: string;          // for quick display
  total: number;
  data: InvoiceData;          // full snapshot
  savedAt: number;
}

export const MAX_SAVED_INVOICES = 10;

import { InvoiceData, InvoiceTotals } from '@/types/invoice';

export interface InvoiceIssues {
  /** Problems that make the exported file useless — export is refused. */
  blocking: string[];
  /** Things worth fixing, but the invoice is still usable without them. */
  advisory: string[];
}

/**
 * Checks an invoice is worth exporting.
 *
 * The bar for `blocking` is deliberately low: only refuse when the resulting
 * PDF would be meaningless. Everything else is advisory, because plenty of real
 * invoices legitimately leave fields blank.
 */
export function getInvoiceIssues(invoice: InvoiceData, totals: InvoiceTotals): InvoiceIssues {
  const blocking: string[] = [];
  const advisory: string[] = [];

  const namedItems = invoice.items.filter((i) => i.name.trim());

  if (invoice.items.length === 0) {
    blocking.push('حداقل یک کالا یا خدمت به فاکتور اضافه کنید');
  } else if (namedItems.length === 0) {
    blocking.push('برای اقلام فاکتور شرح وارد کنید');
  }

  if (!invoice.seller.company.trim() && !invoice.seller.name.trim()) {
    blocking.push('نام فروشنده یا فروشگاه را وارد کنید');
  }

  if (!invoice.buyer.company.trim() && !invoice.buyer.name.trim()) {
    advisory.push('نام خریدار وارد نشده است');
  }

  const unnamed = invoice.items.length - namedItems.length;
  if (namedItems.length > 0 && unnamed > 0) {
    advisory.push(`${unnamed} ردیف بدون شرح است`);
  }

  if (invoice.items.some((i) => i.unitPrice <= 0)) {
    advisory.push('بعضی اقلام قیمت ندارند');
  }

  if (totals.total <= 0 && blocking.length === 0) {
    advisory.push('مبلغ قابل پرداخت صفر است');
  }

  if (!invoice.invoiceNumber.trim()) {
    advisory.push('شماره فاکتور خالی است');
  }

  return { blocking, advisory };
}

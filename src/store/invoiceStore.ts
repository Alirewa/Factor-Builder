import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  InvoiceData, InvoiceItem, InvoiceTotals, ThemeMode,
  SavedProfile, SavedInvoice, MAX_SAVED_INVOICES, INVOICE_TYPE_LABELS, DEFAULT_UNIT,
} from '@/types/invoice';
import { calculateTotals, calculateItemTotal, generateInvoiceNumber, getTodayDate } from '@/lib/utils';

const defaultInvoice: InvoiceData = {
  invoiceNumber: '', // generated lazily on client to avoid SSR/client hydration mismatch
  invoiceDate: '',   // same — filled by initInvoice() after rehydration
  invoiceType: 'sale',
  seller: { name: '', company: '', address: '', phone: '', email: '', nationalId: '' },
  buyer:  { name: '', company: '', address: '', phone: '', email: '', nationalId: '' },
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
};

interface InvoiceStore {
  invoice: InvoiceData;
  totals: InvoiceTotals;
  theme: ThemeMode;
  isCustomizationOpen: boolean;
  isResetModalOpen: boolean;
  isInvoiceListOpen: boolean;
  savedProfiles: SavedProfile[];
  savedInvoices: SavedInvoice[];

  // Invoice CRUD
  updateInvoice: (data: Partial<InvoiceData>) => void;
  updateSeller:  (data: Partial<InvoiceData['seller']>) => void;
  updateBuyer:   (data: Partial<InvoiceData['buyer']>) => void;
  addItem:       () => void;
  updateItem:    (id: string, data: Partial<Omit<InvoiceItem, 'id' | 'total'>>) => void;
  duplicateItem: (id: string) => void;
  removeItem:    (id: string) => void;
  updateCustomization: (data: Partial<InvoiceData['customization']>) => void;
  updateSignature:     (data: Partial<InvoiceData['signature']>) => void;
  resetInvoice: () => void;

  // Lifecycle
  initInvoice: () => void;   // call once on client mount after rehydration

  // UI
  setTheme: (t: ThemeMode) => void;
  toggleCustomization: () => void;
  toggleResetModal:    () => void;
  toggleInvoiceList:   () => void;

  // Seller profile actions
  saveProfile:   (name: string) => SavedProfile;
  loadProfile:   (id: string) => void;
  deleteProfile: (id: string) => void;

  // Presets

  // Saved invoice actions (max 10)
  saveCurrentInvoice:  () => SavedInvoice | null;
  loadSavedInvoice:    (id: string) => void;
  deleteSavedInvoice:  (id: string) => void;
  updateSavedInvoice:  (id: string) => void;   // overwrite with current data
}

/** Fill in fields added — and drop options removed — after a user's state was persisted. */
function upgradeInvoice(inv: InvoiceData): InvoiceData {
  if (!inv) return inv;
  // 'purchase' was dropped as an invoice type — fall back to a sale invoice.
  const invoiceType = inv.invoiceType === 'proforma' ? 'proforma' : 'sale';

  return {
    ...inv,
    invoiceType,
    globalDiscountType: inv.globalDiscountType ?? 'percent',
    items: (inv.items ?? []).map((it) => ({ ...it, unit: it.unit || DEFAULT_UNIT })),
    customization: {
      ...defaultInvoice.customization,
      ...inv.customization,
      currency:          inv.customization?.currency ?? 'rial',
      showAmountInWords: inv.customization?.showAmountInWords ?? true,
      showBismillah:     inv.customization?.showBismillah ?? true,
    },
  };
}

/** Maximum rows on one invoice — keeps the result on a single A4 sheet. */
export const MAX_ITEMS = 10;

function recalc(inv: InvoiceData): InvoiceTotals {
  return calculateTotals(inv.items, inv.taxRate, inv.globalDiscount, inv.globalDiscountType);
}

function makeInvoiceLabel(inv: InvoiceData): string {
  const type = INVOICE_TYPE_LABELS[inv.invoiceType];
  const buyer = inv.buyer.company || inv.buyer.name || 'بدون خریدار';
  return `${type} — ${buyer}`;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoice: defaultInvoice,
      totals:  recalc(defaultInvoice),
      theme:   'light',
      isCustomizationOpen: false,
      isResetModalOpen:    false,
      isInvoiceListOpen:   false,
      savedProfiles: [],
      savedInvoices: [],

      updateInvoice: (data) =>
        set((s) => { const u = { ...s.invoice, ...data }; return { invoice: u, totals: recalc(u) }; }),

      updateSeller: (data) =>
        set((s) => ({ invoice: { ...s.invoice, seller: { ...s.invoice.seller, ...data } } })),

      updateBuyer: (data) =>
        set((s) => ({ invoice: { ...s.invoice, buyer: { ...s.invoice.buyer, ...data } } })),

      addItem: () =>
        set((s) => {
          if (s.invoice.items.length >= MAX_ITEMS) return s;
          const item: InvoiceItem = { id: crypto.randomUUID(), name: '', quantity: 1, unit: DEFAULT_UNIT, unitPrice: 0, total: 0 };
          const u = { ...s.invoice, items: [...s.invoice.items, item] };
          return { invoice: u, totals: recalc(u) };
        }),

      updateItem: (id, data) =>
        set((s) => {
          const items = s.invoice.items.map((it) => {
            if (it.id !== id) return it;
            const m = { ...it, ...data };
            return { ...m, total: calculateItemTotal(m) };
          });
          const u = { ...s.invoice, items };
          return { invoice: u, totals: recalc(u) };
        }),

      duplicateItem: (id) =>
        set((s) => {
          if (s.invoice.items.length >= MAX_ITEMS) return s;
          const i = s.invoice.items.findIndex((it) => it.id === id);
          if (i === -1) return s;
          const copy: InvoiceItem = { ...s.invoice.items[i], id: crypto.randomUUID() };
          const items = [...s.invoice.items];
          items.splice(i + 1, 0, copy);   // insert right below the original
          const u = { ...s.invoice, items };
          return { invoice: u, totals: recalc(u) };
        }),

      removeItem: (id) =>
        set((s) => {
          const u = { ...s.invoice, items: s.invoice.items.filter((i) => i.id !== id) };
          return { invoice: u, totals: recalc(u) };
        }),

      updateCustomization: (data) =>
        set((s) => ({ invoice: { ...s.invoice, customization: { ...s.invoice.customization, ...data } } })),

      updateSignature: (data) =>
        set((s) => ({ invoice: { ...s.invoice, signature: { ...s.invoice.signature, ...data } } })),

      // ── Init (called once on client after rehydration) ──────────────────────
      initInvoice: () => {
        const { invoice } = get();
        const updates: Partial<InvoiceData> = {};
        if (!invoice.invoiceNumber) updates.invoiceNumber = generateInvoiceNumber();
        if (!invoice.invoiceDate) updates.invoiceDate = getTodayDate();
        // `totals` is derived and deliberately not persisted, so it always has
        // to be recomputed from the rehydrated invoice — otherwise a returning
        // user sees a fully populated invoice with a zero total.
        set((s) => {
          const u = { ...s.invoice, ...updates };
          return { invoice: u, totals: recalc(u) };
        });
      },

      resetInvoice: () => {
        const fresh = { ...defaultInvoice, invoiceNumber: generateInvoiceNumber(), invoiceDate: getTodayDate() };
        set({ invoice: fresh, totals: recalc(fresh), isResetModalOpen: false });
      },

      setTheme: (theme) => set({ theme }),
      toggleCustomization: () => set((s) => ({ isCustomizationOpen: !s.isCustomizationOpen })),
      toggleResetModal:    () => set((s) => ({ isResetModalOpen:    !s.isResetModalOpen })),
      toggleInvoiceList:   () => set((s) => ({ isInvoiceListOpen:   !s.isInvoiceListOpen })),

      // ── Seller profiles ────────────────────────────────────────────────────
      saveProfile: (name) => {
        const { invoice } = get();
        const profile: SavedProfile = {
          id: crypto.randomUUID(),
          name: name.trim(),
          seller:         { ...invoice.seller },
          stampImage:     invoice.signature.stampImage,
          signatureImage: invoice.signature.signatureImage,
          logoImage:      invoice.customization.logoImage,
          primaryColor:   invoice.customization.primaryColor,
          createdAt: Date.now(),
        };
        set((s) => ({ savedProfiles: [...s.savedProfiles, profile] }));
        return profile;
      },

      loadProfile: (id) => {
        const p = get().savedProfiles.find((x) => x.id === id);
        if (!p) return;
        set((s) => ({
          invoice: {
            ...s.invoice,
            seller:    { ...p.seller },
            signature: { ...s.invoice.signature, stampImage: p.stampImage, signatureImage: p.signatureImage },
            customization: { ...s.invoice.customization, logoImage: p.logoImage, primaryColor: p.primaryColor },
          },
        }));
      },

      deleteProfile: (id) =>
        set((s) => ({ savedProfiles: s.savedProfiles.filter((p) => p.id !== id) })),

      // ── Saved invoices ─────────────────────────────────────────────────────
      saveCurrentInvoice: () => {
        const { invoice, totals, savedInvoices } = get();
        if (savedInvoices.length >= MAX_SAVED_INVOICES) return null; // caller shows error

        const si: SavedInvoice = {
          id: crypto.randomUUID(),
          label:         makeInvoiceLabel(invoice),
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate:   invoice.invoiceDate,
          invoiceType:   invoice.invoiceType,
          buyerName:     invoice.buyer.company || invoice.buyer.name || '—',
          total:         totals.total,
          data:          JSON.parse(JSON.stringify(invoice)), // deep clone
          savedAt:       Date.now(),
        };
        set((s) => ({ savedInvoices: [si, ...s.savedInvoices] }));
        return si;
      },

      loadSavedInvoice: (id) => {
        const si = get().savedInvoices.find((x) => x.id === id);
        if (!si) return;
        const inv = upgradeInvoice(JSON.parse(JSON.stringify(si.data)) as InvoiceData);
        set({ invoice: inv, totals: recalc(inv), isInvoiceListOpen: false });
      },

      deleteSavedInvoice: (id) =>
        set((s) => ({ savedInvoices: s.savedInvoices.filter((i) => i.id !== id) })),

      updateSavedInvoice: (id) => {
        const { invoice, totals } = get();
        set((s) => ({
          savedInvoices: s.savedInvoices.map((si) =>
            si.id !== id
              ? si
              : {
                  ...si,
                  label:         makeInvoiceLabel(invoice),
                  invoiceNumber: invoice.invoiceNumber,
                  invoiceDate:   invoice.invoiceDate,
                  invoiceType:   invoice.invoiceType,
                  buyerName:     invoice.buyer.company || invoice.buyer.name || '—',
                  total:         totals.total,
                  data:          JSON.parse(JSON.stringify(invoice)),
                  savedAt:       Date.now(),
                }
          ),
        }));
      },
    }),
    {
      name: 'factor-saz-v2',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // prevents SSR/client mismatch from non-deterministic defaults
      version: 4,
      // Older saved state predates the unit column and the Iranian print theme —
      // backfill the new fields so rehydrated invoices render correctly.
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== 'object') return persisted;
        const state = persisted as { invoice?: InvoiceData; savedInvoices?: SavedInvoice[] };
        if (version < 4) {
          if (state.invoice) state.invoice = upgradeInvoice(state.invoice);
          if (Array.isArray(state.savedInvoices)) {
            state.savedInvoices = state.savedInvoices.map((si) => ({ ...si, data: upgradeInvoice(si.data) }));
          }
        }
        return state;
      },
      partialize: (s) => ({
        invoice:       s.invoice,
        theme:         s.theme,
        savedProfiles: s.savedProfiles,
        savedInvoices: s.savedInvoices,
      }),
    }
  )
);

# Persian Invoice Builder — فاکتورساز

A free, client-side Persian (Farsi) invoice generator. No backend, no sign-up, no tracking — everything runs in your browser and stays on your device.

**[Live Demo](https://alirewa.github.io/Factor-Builder/)** &nbsp;|&nbsp; License key: `FACTO-RSAZ0-PUBLI-CDEMO` *(shown on the sign-in screen)*

---

## Why

Most invoice generators are built for Latin, left-to-right layouts and quietly break on Persian: disconnected letters, Latin digits mixed into Persian text, dates in the wrong calendar, and PDFs that don't survive a black-and-white office printer.

This one is built the other way round — RTL and Persian typography first, print second, screen third.

---

## Features

**Invoice**
- **5 templates** — Store (monochrome, print-first), Formal, Modern, Corporate, Minimal
- **Sale invoice & proforma** (پیش‌فاکتور)
- **Unit column** — عدد، دستگاه، کیلوگرم، متر، ساعت… free text with suggestions
- **Amount in words** (مبلغ به حروف) — full Persian number-to-words
- **Tax + discount** — discount as a percentage *or* a flat amount
- **Rial / Toman** switch, applied consistently to inputs and output
- **Jalali (Shamsi) date picker** — native Persian calendar
- **Optional «بسمه تعالی»** header and custom footer text

**Output**
- **PDF export** — A4, multi-page when the content needs it
- **JPEG export** — same capture as the PDF, for WhatsApp/Telegram
- **Print** — opens a clean print window with only the invoice
- Exports are blocked on an obviously empty invoice, with a clear reason

**Workflow**
- **Live preview** with template and colour switching right above the sheet
- **Save & load** — up to 10 invoices in `localStorage`
- **Seller profiles** — reuse your details, logo, stamp and signature
- **Logo, stamp & signature upload** — stamp/signature print only if uploaded
- **Dark mode**, responsive down to mobile
- **Nothing leaves your device**

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first config) |
| State | Zustand + `persist` (localStorage) |
| Date picker | react-multi-date-picker (Jalali) |
| Export | html2canvas + jsPDF |
| Animation | Framer Motion |
| Tests | Vitest |
| Font | Vazirmatn |

---

## Getting Started

```bash
git clone https://github.com/Alirewa/Factor-Builder.git
cd Factor-Builder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the key shown on screen.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Static export to `/out` |
| `npm test` | Run the unit tests |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |

---

## Notes for contributors

A few things in this codebase are load-bearing and easy to break by accident:

- **Never use CSS `zoom` inside an invoice template.** Screenshot libraries copy `zoom` onto every cloned node, so it compounds through the tree and wrecks the export. Font scaling goes through the `useFs()` context in `templates/shared.tsx`.
- **Never set `letter-spacing` on Persian text.** Persian is a connected script; tracking breaks the joins between letters.
- **Templates are styled with inline hex colours only.** html2canvas can't parse the `oklch()`/`lab()` colours Tailwind v4 emits, and the export runs over the template subtree.
- **All money is stored in rial**, regardless of the displayed currency. Convert at the input/output edges with `fromCurrencyUnit()` / `toCurrencyUnit()`.
- **`totals` is derived and not persisted** — it is recomputed on rehydration.

The money math and the Persian number-to-words conversion are covered by tests (`src/lib/*.test.ts`). Please keep them green.

---

## License Gate

The app opens with a license screen, verified client-side with SHA-256 — the plaintext key is never stored in source.

This build ships a **public demo key** displayed on the sign-in screen, so anyone can try it. Each browser still gets its own empty invoice; nothing is shared between visitors.

### Locking it down with your own key

1. Pick a 20-character alphanumeric key (e.g. `MYKEY-12345-ABCDE-XYZ99`).
2. Compute its SHA-256 hash **without dashes**:

   ```bash
   node -e "const c=require('crypto');console.log(c.createHash('sha256').update('MYKEY12345ABCDEXYZ99').digest('hex'))"
   ```

3. In `src/components/LicenseGate.tsx`, replace `LICENSE_HASH` with your hash and set `PUBLIC_KEY` to `null` so the hint box disappears.
4. Rebuild and redeploy. The old key stops working immediately.

> This is a soft gate for casual access control, not real security — the check runs in the browser.

---

## Deployment

`npm run build` produces a fully static `/out` folder. Deploy it anywhere:

- **GitHub Pages** — auto-deployed via GitHub Actions on every push to `master`
- **cPanel / DirectAdmin** — upload the contents of `out/` to `public_html`
- **Netlify / Vercel** — build command `npm run build`, publish directory `out`

### basePath

The deploy workflow sets `NEXT_PUBLIC_BASE_PATH=/Factor-Builder` so assets resolve under the repo subdirectory. If you fork under a different name, update that value in `.github/workflows/deploy.yml`.

---

## License

MIT — free for personal and commercial use.

---

Built with ❤️ by [@alirewa](https://github.com/alirewa)

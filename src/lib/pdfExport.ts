import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ELEMENT_ID = 'invoice-print-root';

/** A4 at 96 dpi — the CSS pixel canvas every capture is laid out on. */
const A4_W_PX = 794;
const A4_H_PX = 1123;

/** Anything up to this much over one page is squeezed onto one page instead of split. */
const SINGLE_PAGE_TOLERANCE = 1.06;

/** Capture resolution multiplier — 2.5× keeps Persian text crisp at A4. */
const CAPTURE_SCALE = 2.5;

/** JPEG quality for the image export — high enough to stay sharp when zoomed. */
const JPEG_QUALITY = 0.94;

/**
 * Wait for the browser to lay out and paint the off-screen clone.
 *
 * Two animation frames are the reliable signal, but `requestAnimationFrame`
 * never fires while the tab is backgrounded or otherwise not compositing — so
 * a timer races it, otherwise an export started in a hidden tab hangs forever.
 */
function waitForPaint(): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, 300);
    requestAnimationFrame(() => requestAnimationFrame(done));
  });
}

/** Find the invoice element or throw. */
function getSource(): HTMLElement {
  const el = document.getElementById(ELEMENT_ID);
  if (!el) throw new Error('پیش‌نمایش فاکتور یافت نشد');
  return el;
}

/**
 * Render the invoice to a canvas.
 *
 * html2canvas rasterises against the live document, so the Vazirmatn face that
 * is already loaded on the page is used as-is. html-to-image, by contrast, has
 * to inline every @font-face it finds into an SVG foreignObject — with the
 * Vazirmatn family served from a CDN that meant re-downloading megabytes of
 * woff2 on every export, which is what made PDF generation hang.
 *
 * The node is cloned into a clean off-screen container first so no parent
 * transform, scroll offset or preview zoom can corrupt the geometry.
 */
async function captureInvoiceCanvas(source: HTMLElement): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  // Positioned far off-screen rather than hidden: html2canvas honours
  // `opacity` and `visibility`, so those would blank the capture.
  //
  // `absolute`, never `fixed`: html2canvas re-anchors fixed elements to the
  // scroll position while building its clone, which shifted the capture window
  // down and sliced the top off the invoice. Absolute coordinates are
  // document-relative and survive the clone untouched.
  container.style.cssText = [
    'position:absolute',
    'top:0',
    'left:-20000px',
    `width:${A4_W_PX}px`,
    'background:#ffffff',
    'overflow:visible',
    'direction:rtl',
    'pointer-events:none',
    'z-index:-2147483647',
    // html2canvas 1.4.1 cannot parse lab()/oklch(), which is what Tailwind v4
    // emits. The invoice templates are styled entirely with inline hex, but an
    // inherited `color` from the app chrome would still reach it — so pin the
    // inherited values here and keep the capture out of that colour space.
    'color:#0f172a',
    'font-family:Vazirmatn, Tahoma, sans-serif',
  ].join(';');

  const clone = source.cloneNode(true) as HTMLElement;
  clone.id = `${ELEMENT_ID}-capture`;   // keep the original id unique in the document
  clone.style.width = `${A4_W_PX}px`;
  clone.style.margin = '0';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await document.fonts.ready;
    await waitForPaint();

    // Let html2canvas derive the crop box from the element itself. Passing an
    // explicit width/height/windowWidth only gives the origin and the box two
    // chances to disagree, which is how the top used to get clipped.
    return await html2canvas(clone, {
      scale: CAPTURE_SCALE,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      logging: false,
      removeContainer: true,
    });
  } finally {
    container.remove();
  }
}

/** Cut one A4-tall band out of the full-height capture. */
function sliceToDataUrl(
  source: HTMLCanvasElement,
  sourceY: number,
  sourceHeight: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = Math.ceil(sourceHeight);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('امکان پردازش تصویر فاکتور نیست');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    source,
    0, sourceY, source.width, sourceHeight,
    0, 0, source.width, sourceHeight
  );

  return canvas.toDataURL('image/png');
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ─────────────────────────────────────────────────────────────────────────────
// JPEG image download
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Exports exactly the same capture the PDF is built from, so both formats show
 * the invoice identically. JPEG has no alpha channel, so the canvas is flattened
 * onto white first — otherwise transparent areas come out black.
 */
export async function exportInvoiceToImage(invoiceNumber: string): Promise<void> {
  const canvas = await captureInvoiceCanvas(getSource());

  const flat = document.createElement('canvas');
  flat.width = canvas.width;
  flat.height = canvas.height;

  const ctx = flat.getContext('2d');
  if (!ctx) throw new Error('امکان پردازش تصویر فاکتور نیست');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(canvas, 0, 0);

  downloadDataUrl(
    flat.toDataURL('image/jpeg', JPEG_QUALITY),
    `فاکتور-${invoiceNumber || 'بدون-شماره'}.jpg`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF download
// ─────────────────────────────────────────────────────────────────────────────
export async function exportInvoiceToPDF(invoiceNumber: string): Promise<void> {
  const canvas = await captureInvoiceCanvas(getSource());

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageW = pdf.internal.pageSize.getWidth();    // 210 mm
  const pageH = pdf.internal.pageSize.getHeight();   // 297 mm

  const pxPerMm = canvas.width / pageW;             // capture pixels per mm of paper
  const fullHeightMM = canvas.height / pxPerMm;

  if (fullHeightMM <= pageH * SINGLE_PAGE_TOLERANCE) {
    // Fits (or nearly fits) on a single page — shrink slightly rather than split.
    const drawH = Math.min(fullHeightMM, pageH);
    const drawW = (drawH / fullHeightMM) * pageW;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageW - drawW) / 2, 0, drawW, drawH, undefined, 'FAST');
  } else {
    // Taller than A4 — split into full-width pages instead of squashing it.
    const pageHeightPx = Math.floor(pageH * pxPerMm);
    let offsetPx = 0;
    let first = true;

    while (offsetPx < canvas.height - 1) {
      const bandPx = Math.min(pageHeightPx, canvas.height - offsetPx);
      if (!first) pdf.addPage();
      first = false;

      const band = sliceToDataUrl(canvas, offsetPx, bandPx);
      pdf.addImage(band, 'PNG', 0, 0, pageW, bandPx / pxPerMm, undefined, 'FAST');
      offsetPx += bandPx;
    }
  }

  pdf.save(`فاکتور-${invoiceNumber || 'بدون-شماره'}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Print — opens a dedicated print window containing ONLY the invoice HTML.
// This avoids printing the entire app page (form, navbar, etc.).
// ─────────────────────────────────────────────────────────────────────────────
export function printInvoice(): void {
  const source = document.getElementById(ELEMENT_ID);
  if (!source) { alert('پیش‌نمایش فاکتور یافت نشد'); return; }

  const pw = window.open('', '_blank', 'width=900,height=700');
  if (!pw) { alert('لطفاً پنجره‌های بازشو (popup) را در مرورگر مجاز کنید'); return; }

  pw.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="utf-8">
  <title>چاپ فاکتور</title>
  <link rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css">
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      background: #ffffff;
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #${ELEMENT_ID} {
      width: ${A4_W_PX}px;
      margin: 0 auto;
      transform-origin: top center;
    }
    /* Keep table rows and the totals block from being cut across pages */
    tr, img { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>
<body>
  ${source.outerHTML}
  <script>
    document.fonts.ready.then(function () {
      var el = document.getElementById('${ELEMENT_ID}');
      // Only shrink when the invoice slightly overflows one A4 sheet; anything
      // genuinely longer is left to paginate naturally.
      if (el) {
        var A4H = ${A4_H_PX};
        var h = el.scrollHeight;
        if (h > A4H && h <= A4H * ${SINGLE_PAGE_TOLERANCE + 0.14}) {
          var s = A4H / h;
          el.style.transform = 'scale(' + s + ')';
          el.style.marginBottom = ((h * s) - h) + 'px';
        }
      }
      window.print();
      window.onafterprint = function () { window.close(); };
    });
  <\/script>
</body>
</html>`);

  pw.document.close();
}

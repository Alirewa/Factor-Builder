'use client';

import { useRef } from 'react';
import { useInvoiceStore } from '@/store/invoiceStore';
import { SectionCard } from '@/components/ui/SectionCard';
import { fileToBase64, validateImageFile, toPersianDigits } from '@/lib/utils';
import { Stamp, PenTool, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function SignatureUpload() {
  const { invoice, updateSignature } = useInvoiceStore();
  const { signature } = invoice;
  const stampRef = useRef<HTMLInputElement>(null);
  const uploadedCount = (signature.signatureImage ? 1 : 0) + (signature.stampImage ? 1 : 0);
  const signRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (
    file: File | undefined | null,
    type: 'stampImage' | 'signatureImage'
  ) => {
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      updateSignature({ [type]: base64 });
      toast.success('تصویر با موفقیت آپلود شد');
    } catch {
      toast.error('خطا در بارگذاری تصویر');
    }
  };

  return (
    <SectionCard
      title="مهر و امضا"
      step={6}
      icon={<PenTool className="w-4 h-4" />}
      badge={uploadedCount === 0 ? 'اختیاری' : `${toPersianDigits(uploadedCount)} تصویر`}
      badgeTone={uploadedCount === 0 ? 'neutral' : 'done'}
      hint="فقط تصاویری که آپلود کنید روی فاکتور چاپ می‌شوند — هیچ خط یا برچسب خالی اضافه نمی‌شود."
      collapsible
      defaultOpen={false}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Signature */}
        <UploadBox
          label="امضا"
          icon={<PenTool className="w-5 h-5" />}
          image={signature.signatureImage}
          inputRef={signRef}
          onUpload={(f) => handleUpload(f, 'signatureImage')}
          onRemove={() => updateSignature({ signatureImage: null })}
        />

        {/* Stamp */}
        <UploadBox
          label="مهر"
          icon={<Stamp className="w-5 h-5" />}
          image={signature.stampImage}
          inputRef={stampRef}
          onUpload={(f) => handleUpload(f, 'stampImage')}
          onRemove={() => updateSignature({ stampImage: null })}
        />
      </div>
      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-3">
        فرمت‌های پشتیبانی: JPG، PNG، WEBP — حداکثر ۲ مگابایت — پس‌زمینه شفاف (PNG) توصیه می‌شود.
      </p>
    </SectionCard>
  );
}

function UploadBox({
  label,
  icon,
  image,
  inputRef,
  onUpload,
  onRemove,
}: {
  label: string;
  icon: React.ReactNode;
  image: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => onUpload(e.target.files?.[0])}
        onClick={(e) => ((e.target as HTMLInputElement).value = '')}
      />

      {image ? (
        <div className="relative border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-700/30">
          <img
            src={image}
            alt={label}
            className="w-full h-24 object-contain p-2"
          />
          <button
            onClick={onRemove}
            className="absolute top-1.5 left-1.5 p-1 bg-white dark:bg-slate-800 rounded-full shadow text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-1.5 left-1.5 px-2 py-1 bg-white dark:bg-slate-800 rounded-md shadow text-xs text-gray-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
          >
            تغییر
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-24 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-all group"
        >
          <div className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
            {icon}
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Upload className="w-3 h-3" />
            <span>آپلود {label}</span>
          </div>
        </button>
      )}
    </div>
  );
}

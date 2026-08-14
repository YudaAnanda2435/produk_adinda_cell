import { Download, Printer } from "lucide-react";
import {
  createReceiptPngDataUrl,
  formatReceiptAmount,
  RECEIPT_ADDRESS_LINES,
  RECEIPT_CONTACT,
  RECEIPT_LOGO_SRC,
  RECEIPT_STORE_NAME,
  RECEIPT_TAGLINE,
} from "../utils/receipt";
import { printThermalReceipt } from "../utils/thermalPrinter";

export default function ReceiptModal({
  receiptData,
  receiptItems,
  receiptSubtotal,
  receiptShipping,
  receiptGrandTotal,
  onClose,
  onDownloadSuccess,
  onDownloadError,
}) {
  if (!receiptData) return null;

  const buildReceiptImage = () =>
    createReceiptPngDataUrl({
      receiptData,
      receiptItems,
      receiptSubtotal,
      receiptShipping,
      receiptGrandTotal,
    });

  const handlePrint = async () => {
    try {
      await printThermalReceipt({
        receiptData,
        receiptItems,
        receiptSubtotal,
        receiptShipping,
        receiptGrandTotal,
      });
    } catch (error) {
      console.error("Gagal mencetak struk thermal:", error);
      window.alert(
        "Gagal cetak thermal. Pastikan QZ Tray sudah terinstall, sedang berjalan, dan printer thermal terhubung.",
      );
      onDownloadError?.();
    }
  };

  const handleDownloadPng = async () => {
    try {
      const dataUrl = await buildReceiptImage();
      const link = document.createElement("a");
      const billNumber = String(receiptData.billNumber || Date.now()).replace(
        "#",
        "",
      );
      link.href = dataUrl;
      link.download = `Struk-Adinda-${billNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onDownloadSuccess?.();
    } catch (error) {
      console.error("Gagal membuat struk PNG:", error);
      onDownloadError?.();
    }
  };

  return (
    <>
      <style>{`
        @media print {
          @page { size: 58mm 160mm; margin: 0; }
          html,
          body,
          #root {
            width: 58mm !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }
          #root * {
            visibility: hidden !important;
          }
          .receipt-preview-shell {
            display: block !important;
            visibility: visible !important;
            position: fixed !important;
            inset: 0 auto auto 0 !important;
            width: 58mm !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
            backdrop-filter: none !important;
          }
          .receipt-preview-shell * {
            visibility: visible !important;
          }
          #receipt-box {
            display: block !important;
            position: static !important;
            width: 58mm !important;
            max-width: 58mm !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 2mm 1.2mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
            color: black !important;
            transform: none !important;
            animation: none !important;
          }
          #receipt-box * {
            color: black !important;
            visibility: visible !important;
          }
        }
      `}</style>

      <div className="receipt-preview-shell fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm print:static print:block print:bg-white print:p-0">
        <div
          id="receipt-box"
          className="w-[348px] bg-[#faf8ef] px-2.5 py-4 text-slate-900 shadow-2xl animate-in zoom-in-95 duration-200 print:w-[58mm] print:bg-white print:shadow-none"
          style={{
            fontFamily:
              '"Courier New", "Lucida Console", "Roboto Mono", monospace',
          }}
        >
          <div className="text-center">
            <img
              src={RECEIPT_LOGO_SRC}
              alt="Logo Adinda Cell"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              className="mx-auto mb-1.5 h-14 w-auto object-contain grayscale"
            />
            <h2 className="text-[30px] font-semibold leading-none">
              {RECEIPT_STORE_NAME}
            </h2>
            <p className="mt-1 text-[16px] font-semibold leading-tight text-slate-800">
              {RECEIPT_TAGLINE}
            </p>
            <div className="mt-1.5 text-[17px] font-semibold leading-tight text-slate-700">
              {RECEIPT_ADDRESS_LINES.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>{RECEIPT_CONTACT}</p>
            </div>
          </div>

          <div className="my-2 border-t-2 border-dashed border-slate-700" />

          <div className="flex items-start justify-between text-[19px] font-semibold leading-tight">
            <span>Bill {receiptData.billNumber}</span>
            <span className="text-right">
              {receiptData.tanggal} {receiptData.jam}
            </span>
          </div>

          <div className="my-2 border-t-2 border-dashed border-slate-700" />

          <div className="space-y-1.5 text-[19px] font-semibold leading-tight">
            <div className="flex items-end justify-between gap-3 pt-1">
              <span>Item x Qty</span>
              <span>Rate</span>
            </div>
            {receiptItems.map((item, index) => (
              <div key={`${item.id_produk}-${index}`} className="space-y-1">
                <div className="flex items-end justify-between gap-3">
                  <span className="max-w-[230px] break-words">
                    {item.nama_produk}
                  </span>
                  <span className="shrink-0">
                    {formatReceiptAmount(item.total_harga)}
                  </span>
                </div>
                {item.keterangan && item.keterangan !== "-" && (
                  <div className="max-w-[230px] break-words text-[18px] text-slate-700">
                    ({item.keterangan})
                  </div>
                )}
                <div className="flex items-end justify-between gap-3 text-[18px] text-slate-700">
                  <span>
                    {item.jumlah} x {formatReceiptAmount(item.harga_satuan)}
                  </span>
                  <span>{formatReceiptAmount(item.total_harga)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="my-2 border-t-2 border-dashed border-slate-700" />

          <div className="space-y-0.5 text-[20px] font-semibold leading-tight">
            <div className="flex justify-between gap-3">
              <span>Total pesanan</span>
              <span>{formatReceiptAmount(receiptSubtotal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Ongkir</span>
              <span>{formatReceiptAmount(receiptShipping)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Total bayar</span>
              <span>{formatReceiptAmount(receiptGrandTotal)}</span>
            </div>
          </div>

          <div className="my-2 border-t-2 border-dashed border-slate-700" />

          <div className="pt-1.5 text-center text-[23px] font-semibold tracking-wide">
            TERIMA KASIH
          </div>

          <div className="receipt-actions mt-6 grid grid-cols-1 gap-2 print:hidden">
            <button
              onClick={handleDownloadPng}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-colors hover:bg-emerald-700"
            >
              <Download size={16} /> Unduh PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700"
            >
              <Printer size={16} /> Cetak Thermal
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

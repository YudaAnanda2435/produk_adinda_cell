import { useEffect, useState, useMemo } from "react";
import {
  Trash2,
  Receipt,
  Clock,
  Download,
  Calendar,
  FileText,
  Table,
  CheckCircle2, // Tambahan icon untuk Snackbar
  AlertCircle, // Tambahan icon untuk Snackbar
} from "lucide-react";
import * as api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import LoadingModal from "../components/LoadingModal";
import Snackbar from "@mui/joy/Snackbar"; // Tambahan import Snackbar

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);
};

export default function Riwayat({
  transactions,
  fetchProducts,
  fetchTransactions,
  refreshKey,
  isLoading,
  setTransactions,
}) {
  const sekarang = new Date();
  const awalBulan = new Date(sekarang.getFullYear(), sekarang.getMonth(), 2)
    .toISOString()
    .split("T")[0];
  const hariIni = sekarang.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(awalBulan);
  const [endDate, setEndDate] = useState(hariIni);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  // State untuk Loading Modal
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // State untuk Notifikasi Snackbar
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    color: "success",
  });

  const filteredTransactions = useMemo(() => {
    if (!startDate || !endDate) return transactions;

    const startWaktu = new Date(startDate).setHours(0, 0, 0, 0);
    const endWaktu = new Date(endDate).setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const tglTrans = new Date(t.tanggal).getTime();
      return tglTrans >= startWaktu && tglTrans <= endWaktu;
    });
  }, [transactions, startDate, endDate]);

  const displayedTransactions = useMemo(
    () => [...filteredTransactions].reverse().slice(0, visibleCount),
    [filteredTransactions, visibleCount],
  );

  useEffect(() => {
    fetchTransactions({ startDate, endDate, refreshKey });
  }, [endDate, fetchTransactions, refreshKey, startDate]);

  const totalOmzet = filteredTransactions.reduce(
    (sum, t) => sum + (Number(t.total_harga) || 0),
    0,
  );
  const totalLaba = filteredTransactions.reduce(
    (sum, t) => sum + (Number(t.laba) || 0),
    0,
  );
  const totalQty = filteredTransactions.reduce(
    (sum, t) => sum + (Number(t.jumlah) || 0),
    0,
  );

  const handleDelete = async () => {
    if (!deleteId) return;

    // 1. Ambil ID target
    const targetId = deleteId;

    // 2. TUTUP MODAL KONFIRMASI SECEPAT KILAT
    setDeleteId(null);

    // 3. BUKA MODAL LOADING
    setLoadingMessage("Membatalkan transaksi & mengembalikan stok...");
    setLoading(true);

    // 4. Simpan memori lama untuk berjaga-jaga jika server error
    const previousTransactions = [...transactions];

    // 5. Hapus baris dari tabel di layar SAAT INI JUGA (Optimistic UI)
    setTransactions(transactions.filter((t) => t.id !== targetId));

    // 6. Proses hapus ke Google Sheets berjalan di latar belakang
    const res = await api.deleteTransaction(targetId);

    // 7. Tentukan aksi setelah server merespons
    if (res && res.status === "success") {
      setNotif({
        open: true,
        message: "Transaksi berhasil dibatalkan!",
        color: "success",
      });
      fetchProducts(true); // Silent refresh untuk mengupdate jumlah stok di halaman produk
      fetchTransactions({
        isSilent: true,
        startDate,
        endDate,
        refreshKey: new Date().getTime(),
      });
    } else {
      setTransactions(previousTransactions); // Kembalikan data yang terhapus
      setNotif({
        open: true,
        message: "Gagal membatalkan transaksi.",
        color: "danger",
      });
    }

    // 8. Tutup Modal Loading
    setLoading(false);
  };

  const handleDeleteAll = async () => {
    setIsDeleteAllOpen(false);
    setLoadingMessage("Menghapus riwayat transaksi pada periode ini...");
    setLoading(true);

    const previousTransactions = [...transactions];
    const targetIds = new Set(filteredTransactions.map((item) => item.id));
    setTransactions(transactions.filter((item) => !targetIds.has(item.id)));

    const res = await api.deleteAllTransactions({ startDate, endDate });

    if (res && res.status === "success") {
      setNotif({
        open: true,
        message: "Riwayat transaksi pada periode ini berhasil dihapus!",
        color: "success",
      });
      fetchTransactions({
        isSilent: true,
        startDate,
        endDate,
        refreshKey: new Date().getTime(),
      });
    } else {
      setTransactions(previousTransactions);
      setNotif({
        open: true,
        message:
          res?.message || "Gagal menghapus riwayat transaksi pada periode ini.",
        color: "danger",
      });
    }

    setLoading(false);
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0)
      return alert("Tidak ada data untuk diunduh.");

    const headers = [
      "Waktu",
      "Nama Produk",
      "Qty",
      "Total Harga",
      "Laba",
      "Metode Pembayaran",
      "Keterangan",
    ];
    const csvData = filteredTransactions.map((t) => {
      const waktu = new Date(t.tanggal).toLocaleString("id-ID");
      return `"${waktu}","${t.nama_produk}","${t.jumlah}","${t.total_harga}","${t.laba}", "${t.metode_pembayaran}","${t.keterangan || "-"}"`;
    });

    const csvContent = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Penjualan_${startDate}_sd_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    setIsExportOpen(false);
    window.print();
  };

  const formatDateLabel = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const periodeLabel =
    startDate === endDate
      ? formatDateLabel(startDate)
      : `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;

  return (
    <>
      <style>{`
        @media print {
          html, body, #root, .h-screen, .overflow-hidden, .overflow-y-auto, .flex-1, main {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
          }
          aside, button, .print-hidden {
            display: none !important;
          }
          #laporan-cetak {
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @page { 
            size: A4 portrait; 
            margin: 15mm; 
          }
        }
      `}</style>

      <div className="flex-1 flex flex-col min-h-0 print:min-h-full! gap-6">
        <div className="flex flex-col md:flex-row justify-between  items-start md:items-center gap-4 print-hidden">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-fontDark flex items-center gap-2">
            <Receipt className="text-blue-600" /> Riwayat Penjualan
          </h1>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto relative">
            <button
              onClick={() => {
                setIsDateOpen(!isDateOpen);
                setIsExportOpen(false);
              }}
              className="flex-1 w-full md:w-fit md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-darkMode border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2.5 shadow-sm hover:border-blue-500 dark:hover:border-borderDark hover:text-blue-600 dark:hover:text-fontDark transition-all text-sm font-bold text-gray-700 dark:text-fontDark"
            >
              <Calendar
                size={18}
                className={isDateOpen ? "text-blue-500" : "text-gray-400"}
              />
              {periodeLabel}
            </button>

            {isDateOpen && (
              <>
                <button
                  type="button"
                  aria-label="Tutup filter tanggal"
                  className="fixed inset-0 z-40 cursor-default bg-transparent"
                  onClick={() => setIsDateOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="font-bold text-gray-800">Filter Riwayat</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                          Mulai
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setVisibleCount(50);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                          Selesai
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setVisibleCount(50);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsDateOpen(false);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors mt-2"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="relative w-full md:w-fit flex-1 md:flex-none">
              <button
                onClick={() => {
                  setIsExportOpen(!isExportOpen);
                  setIsDateOpen(false);
                }}
                className="w-full  flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2.5 shadow-sm transition-all text-sm font-bold"
              >
                <Download size={18} /> Laporan
              </button>

              {isExportOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-sm font-semibold text-gray-700 transition-colors"
                  >
                    <Table size={16} className="text-green-600" /> Unduh CSV
                    (Excel)
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-sm font-semibold text-gray-700 transition-colors"
                  >
                    <FileText size={16} className="text-red-600" /> Cetak /
                    Simpan PDF
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setIsDeleteAllOpen(true);
                setIsDateOpen(false);
                setIsExportOpen(false);
              }}
              disabled={isLoading || loading || filteredTransactions.length === 0}
              className="flex-1 w-full md:w-fit md:flex-none flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              <Trash2 size={18} /> Hapus Semua
            </button>
          </div>
        </div>

        <div
          id="laporan-cetak"
          className="flex min-h-[58dvh] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-borderDark dark:bg-darkMode md:min-h-0"
        >
          <div className="hidden print:block p-6 border-b border-gray-200 mb-4">
            <h1 className="text-2xl font-black text-gray-800 text-center">
              LAPORAN PENJUALAN KONTER
            </h1>
            <p className="text-center text-gray-500 mt-2 font-medium">
              Periode: {periodeLabel}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
            <table className="w-full text-left dark:bg-cardDark border-collapse whitespace-nowrap print:whitespace-normal print:text-[10px]">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-fontDark text-[10px] uppercase font-bold shadow-sm">
                <tr>
                  <th className="p-4 border-b text-start">Waktu</th>
                  <th className="p-4 border-b text-start">Produk</th>
                  <th className="p-4 border-b text-start ">Qty</th>
                  <th className="p-4 border-b text-start ">Total Harga</th>
                  <th className="p-4 border-b text-start  text-green-600">
                    Laba
                  </th>
                  <th className="p-4 border-b text-start">Metode</th>
                  <th className="p-4 border-b text-start">Keterangan</th>
                  <th className="p-4 border-b text-start print-hidden">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading && (
                  <tr>
                    <td
                      colSpan="8"
                      className="p-10 text-center text-gray-400 font-medium"
                    >
                      Memuat transaksi...
                    </td>
                  </tr>
                )}
                {!isLoading && displayedTransactions.map((t, index) => (
                  <tr
                    key={t.id || index}
                    className="hover:bg-gray-50 dark:hover:bg-darkMode transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-fontDark">
                        <Clock size={12} className="print-hidden" />
                        {new Date(t.tanggal).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-sm text-gray-800 dark:text-fontDark">
                      {t.nama_produk}
                    </td>
                    <td className="p-4 text-start text-sm ">{t.jumlah}</td>
                    <td className="p-4 text-start font-semibold text-sm">
                      {formatRupiah(t.total_harga)}
                    </td>
                    <td className="p-4 text-start font-bold text-sm text-green-600">
                      +{formatRupiah(t.laba)}
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-600 dark:text-fontDark">
                      {t.metode_pembayaran || "-"}
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-fontDark max-w-[150px] truncate">
                      {t.keterangan || "-"}
                    </td>
                    <td className="p-4 text-center print-hidden">
                      <button
                        onClick={() => setDeleteId(t.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Batalkan Transaksi"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="p-10 text-center text-gray-400 font-medium"
                    >
                      Tidak ada transaksi pada rentang tanggal ini.
                    </td>
                  </tr>
                )}
              </tbody>

              {filteredTransactions.length > 0 && (
                <tfoot className="sticky bottom-0 z-10 bg-blue-50 dark:bg-darkMode border-t-2 border-gray-200 shadow-[0_-6px_16px_rgba(15,23,42,0.06)]">
                  <tr>
                    <td
                      colSpan="3"
                      className="p-4 text-right font-black text-gray-700 dark:text-fontDark uppercase text-xs tracking-wider"
                    >
                      Total Keseluruhan
                    </td>
                    <td className="p-4 text-center font-black text-sm text-gray-800 dark:text-fontDark">
                      {totalQty}
                    </td>
                    <td className="p-4 text-right font-black text-sm text-blue-700 dark:text-blue-300">
                      {formatRupiah(totalOmzet)}
                    </td>
                    <td className="p-4 text-right font-black text-sm text-green-700 dark:text-green-300">
                      +{formatRupiah(totalLaba)}
                    </td>
                    <td className="p-4 print-hidden" colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {visibleCount < filteredTransactions.length && (
            <div className="flex justify-center border-t border-gray-100 p-4 print-hidden">
              <button
                onClick={() => setVisibleCount((count) => count + 50)}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
              >
                Tampilkan 50 Transaksi Lagi
              </button>
            </div>
          )}

          <div className="hidden print:flex justify-end gap-10 p-6 mt-4 border-t border-gray-200">
            <div className="text-right">
              <p className="text-sm text-gray-500 font-bold uppercase mb-1">
                Total Omzet
              </p>
              <p className="text-xl font-black text-blue-600">
                {formatRupiah(totalOmzet)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-bold uppercase mb-1">
                Total Laba
              </p>
              <p className="text-xl font-black text-green-600">
                {formatRupiah(totalLaba)}
              </p>
            </div>
          </div>
        </div>

        {/* --- AREA MODAL DAN NOTIFIKASI --- */}

        {/* Modal Konfirmasi Batal */}
        <ConfirmModal
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Batalkan Transaksi?"
          message="Data penjualan ini akan dihapus permanen dan stok barang akan dikembalikan secara otomatis ke dalam sistem."
          confirmText="Hapus Transaksi"
          color="danger"
        />

        <ConfirmModal
          open={isDeleteAllOpen}
          onClose={() => setIsDeleteAllOpen(false)}
          onConfirm={handleDeleteAll}
          title="Hapus Semua Riwayat?"
          message={`Semua transaksi pada periode ${periodeLabel} akan dihapus permanen dari riwayat tanpa mengubah stok produk. Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus Semua"
          cancelText="Batal"
          color="danger"
          confirmPhrase="hapus"
          confirmPhraseLabel='Ketik "hapus" untuk mengaktifkan tombol hapus'
        />

        {/* Modal Loading Joy UI */}
        <LoadingModal open={loading} message={loadingMessage} />

        {/* Snackbar Notifikasi Joy UI */}
        <Snackbar
          autoHideDuration={3000}
          open={notif.open}
          color={notif.color}
          variant="solid"
          onClose={(event, reason) => {
            if (reason === "clickaway") return;
            setNotif({ ...notif, open: false });
          }}
          startDecorator={
            notif.color === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )
          }
        >
          <span className="font-semibold text-sm">{notif.message}</span>
        </Snackbar>
      </div>
    </>
  );
}

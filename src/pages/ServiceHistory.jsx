import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Table,
  Trash2,
  Wrench,
} from "lucide-react";
import Snackbar from "@mui/joy/Snackbar";
import ConfirmModal from "../components/ConfirmModal";
import LoadingModal from "../components/LoadingModal";
import * as api from "../services/api";
import {
  filterServiceByDate,
  formatDateLabel,
  formatRupiah,
  getServiceLaba,
  getServiceDateRange,
  getServiceSparepartCost,
  getServiceStats,
  getServiceTotalBayar,
} from "../utils/service";

export default function ServiceHistory({
  serviceTransactions = [],
  setServiceTransactions,
  fetchServiceTransactions,
  refreshKey,
  isLoading,
}) {
  const defaultRange = getServiceDateRange();
  const [startDate, setStartDate] = useState(
    () => localStorage.getItem("serviceHistoryStartDate") || defaultRange.start,
  );
  const [endDate, setEndDate] = useState(
    () => localStorage.getItem("serviceHistoryEndDate") || defaultRange.end,
  );
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    color: "success",
  });

  const filteredServices = useMemo(
    () => filterServiceByDate(serviceTransactions, startDate, endDate),
    [endDate, serviceTransactions, startDate],
  );
  const displayedServices = useMemo(
    () => [...filteredServices].reverse().slice(0, visibleCount),
    [filteredServices, visibleCount],
  );
  const stats = useMemo(
    () => getServiceStats(filteredServices),
    [filteredServices],
  );

  useEffect(() => {
    localStorage.setItem("serviceHistoryStartDate", startDate);
    localStorage.setItem("serviceHistoryEndDate", endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchServiceTransactions?.({ startDate, endDate, refreshKey });
  }, [endDate, fetchServiceTransactions, refreshKey, startDate]);

  const periodeLabel =
    startDate === endDate
      ? formatDateLabel(startDate)
      : `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;

  const showNotif = (message, color = "success") => {
    setNotif({ open: true, message, color });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const targetId = deleteId;
    setDeleteId(null);
    setLoadingMessage("Menghapus transaksi service...");
    setLoading(true);

    const previousServices = [...serviceTransactions];
    setServiceTransactions(
      serviceTransactions.filter((service) => service.id !== targetId),
    );

    const res = await api.deleteServiceTransaction(targetId);
    if (res?.status === "success") {
      showNotif("Transaksi service berhasil dihapus.");
      fetchServiceTransactions?.({
        isSilent: true,
        startDate,
        endDate,
        refreshKey: Date.now(),
      });
    } else {
      setServiceTransactions(previousServices);
      showNotif(res?.message || "Gagal menghapus transaksi service.", "danger");
    }

    setLoading(false);
  };

  const handleDeleteAll = async () => {
    setIsDeleteAllOpen(false);
    setLoadingMessage("Menghapus semua transaksi service pada periode ini...");
    setLoading(true);

    const previousServices = [...serviceTransactions];
    const targetIds = new Set(filteredServices.map((service) => service.id));
    setServiceTransactions(
      serviceTransactions.filter((service) => !targetIds.has(service.id)),
    );

    const res = await api.deleteAllServiceTransactions({ startDate, endDate });
    if (res?.status === "success") {
      showNotif("Semua transaksi service pada periode ini berhasil dihapus.");
      fetchServiceTransactions?.({
        isSilent: true,
        startDate,
        endDate,
        refreshKey: Date.now(),
      });
    } else {
      setServiceTransactions(previousServices);
      showNotif(
        res?.message || "Gagal menghapus semua transaksi service.",
        "danger",
      );
    }

    setLoading(false);
  };

  const handleExportCSV = () => {
    if (filteredServices.length === 0) {
      alert("Tidak ada data service untuk diunduh.");
      return;
    }

    const headers = [
      "Waktu",
      "Pelanggan",
      "No HP",
      "Perangkat",
      "Keluhan",
      "Sparepart / Komponen",
      "Total Bayar",
      "Laba Service",
      "Metode",
    ];
    const csvRows = filteredServices.map((service) => {
      const waktu = new Date(service.tanggal).toLocaleString("id-ID");
      return [
        waktu,
        service.pelanggan,
        service.no_hp,
        service.perangkat,
        service.keluhan,
        getServiceSparepartCost(service),
        getServiceTotalBayar(service),
        getServiceLaba(service),
        service.metode_pembayaran,
      ]
        .map((value) => `"${String(value ?? "-").replaceAll('"', '""')}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Service_${startDate}_sd_${endDate}.csv`;
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
          #laporan-service-cetak {
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          thead { display: table-header-group !important; }
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          @page { size: A4 landscape; margin: 12mm; }
        }
      `}</style>

      <div className="flex-1 flex flex-col min-h-0 gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hidden">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-fontDark flex items-center gap-2">
            <Wrench className="text-blue-600" /> Riwayat Service
          </h1>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto relative">
            <button
              onClick={() => {
                setIsDateOpen(!isDateOpen);
                setIsExportOpen(false);
              }}
              className="flex-1 w-full md:w-fit md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-darkMode border border-gray-200 dark:border-borderDark rounded-xl px-4 py-2.5 shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all text-sm font-bold text-gray-700 dark:text-fontDark"
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
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-darkMode border border-gray-200 dark:border-borderDark rounded-2xl shadow-xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 dark:text-fontDark border-b border-gray-100 dark:border-borderDark pb-3">
                      Filter Riwayat Service
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 dark:text-fontDark uppercase tracking-wider mb-1.5">
                          Mulai
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(event) => {
                            setStartDate(event.target.value);
                            setVisibleCount(50);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 dark:text-fontDark uppercase tracking-wider mb-1.5">
                          Selesai
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(event) => {
                            setEndDate(event.target.value);
                            setVisibleCount(50);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setIsDateOpen(false)}
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
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2.5 shadow-sm transition-all text-sm font-bold"
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
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-sm font-semibold text-gray-700 transition-colors"
                  >
                    <FileText size={16} className="text-red-600" /> Cetak PDF
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
              disabled={isLoading || loading || filteredServices.length === 0}
              className="flex-1 w-full md:w-fit md:flex-none flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              <Trash2 size={18} /> Hapus Semua
            </button>
          </div>
        </div>

        <div
          id="laporan-service-cetak"
          className="flex min-h-[58dvh] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-borderDark dark:bg-darkMode md:min-h-0"
        >
          <div className="hidden print:block p-6 border-b border-gray-200 mb-4">
            <h1 className="text-2xl font-black text-gray-800 text-center">
              LAPORAN SERVICE KONTER
            </h1>
            <p className="text-center text-gray-500 mt-2 font-medium">
              Periode: {periodeLabel}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
            <table className="w-full text-left border-collapse whitespace-nowrap print:whitespace-normal print:text-[10px]">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-fontDark text-[10px] uppercase font-bold shadow-sm">
                <tr>
                  <th className="p-4 border-b text-start">Waktu</th>
                  <th className="p-4 border-b text-start">Pelanggan</th>
                  <th className="p-4 border-b text-start">Perangkat</th>
                  <th className="p-4 border-b text-start">Pekerjaan</th>
                  <th className="p-4 border-b text-start">
                    Sparepart / Komponen
                  </th>
                  <th className="p-4 border-b text-start">Total Bayar</th>
                  <th className="p-4 border-b text-start text-green-600">
                    Laba Service
                  </th>
                  <th className="p-4 border-b text-start">Metode</th>
                  <th className="p-4 border-b text-start print-hidden">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-borderDark">
                {isLoading && (
                  <tr>
                    <td
                      colSpan="9"
                      className="p-10 text-center text-gray-400 font-medium"
                    >
                      Memuat transaksi service...
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  displayedServices.map((service, index) => (
                    <tr
                      key={service.id || index}
                      className="hover:bg-gray-50 dark:hover:bg-cardDark transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-fontDark">
                          <Clock size={12} className="print-hidden" />
                          {new Date(service.tanggal).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-sm text-gray-800 dark:text-fontDark">
                          {service.pelanggan || "-"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">
                          {service.no_hp || "-"}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-semibold text-gray-700 dark:text-fontDark">
                        {service.perangkat || "-"}
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-fontDark max-w-[220px] truncate">
                        {service.keluhan || service.catatan || "-"}
                      </td>
                      <td className="p-4 text-sm font-bold text-orange-600">
                        {formatRupiah(getServiceSparepartCost(service))}
                      </td>
                      <td className="p-4 text-sm font-bold text-blue-700 dark:text-blue-300">
                        {formatRupiah(getServiceTotalBayar(service))}
                      </td>
                      <td className="p-4 text-sm font-black text-green-600">
                        +{formatRupiah(getServiceLaba(service))}
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-600 dark:text-fontDark">
                        {service.metode_pembayaran || "-"}
                      </td>
                      <td className="p-4 text-center print-hidden">
                        <button
                          onClick={() => setDeleteId(service.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Hapus Transaksi Service"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}

                {!isLoading && filteredServices.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="p-10 text-center text-gray-400 font-medium"
                    >
                      Tidak ada transaksi service pada rentang tanggal ini.
                    </td>
                  </tr>
                )}
              </tbody>

              {filteredServices.length > 0 && (
                <tfoot className="sticky bottom-0 z-10 bg-blue-50 dark:bg-cardDark border-t-2 border-gray-200 dark:border-borderDark shadow-[0_-6px_16px_rgba(15,23,42,0.06)]">
                  <tr>
                    <td
                      colSpan="4"
                      className="p-4 text-right font-black text-gray-700 dark:text-fontDark uppercase text-xs tracking-wider"
                    >
                      Total Keseluruhan
                    </td>
                    <td className="p-4 font-black text-sm text-orange-700">
                      {formatRupiah(stats.totalSparepart)}
                    </td>
                    <td className="p-4 font-black text-sm text-blue-700 dark:text-blue-300">
                      {formatRupiah(stats.totalBayar)}
                    </td>
                    <td className="p-4 font-black text-sm text-green-700 dark:text-green-300">
                      +{formatRupiah(stats.totalLaba)}
                    </td>
                    <td className="p-4 print-hidden" colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {visibleCount < filteredServices.length && (
            <div className="flex justify-center border-t border-gray-100 dark:border-borderDark p-4 print-hidden">
              <button
                onClick={() => setVisibleCount((count) => count + 50)}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
              >
                Tampilkan 50 Transaksi Lagi
              </button>
            </div>
          )}
        </div>

        <ConfirmModal
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Hapus Transaksi Service?"
          message="Data transaksi service ini akan dihapus permanen dari laporan. Stok produk tidak akan berubah."
          confirmText="Hapus Transaksi"
          color="danger"
        />

        <ConfirmModal
          open={isDeleteAllOpen}
          onClose={() => setIsDeleteAllOpen(false)}
          onConfirm={handleDeleteAll}
          title="Hapus Semua Riwayat Service?"
          message={`Semua transaksi service pada periode ${periodeLabel} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus Semua"
          cancelText="Batal"
          color="danger"
          confirmPhrase="hapus"
          confirmPhraseLabel='Ketik "hapus" untuk mengaktifkan tombol hapus'
        />

        <LoadingModal open={loading} message={loadingMessage} />
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

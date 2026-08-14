import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  Save,
  Wrench,
} from "lucide-react";
import Snackbar from "@mui/joy/Snackbar";
import LoadingModal from "../components/LoadingModal";
import ReceiptModal from "../components/ReceiptModal";
import * as api from "../services/api";
import { formatRupiah } from "../utils/service";
import { formatReceiptDate, formatReceiptTime } from "../utils/receipt";

const initialForm = {
  pelanggan: "",
  no_hp: "",
  perangkat: "",
  keluhan: "",
  garansi: "",
  modal_sparepart: 0,
  jasa_pengerjaan: 0,
  metode_pembayaran: "Tunai",
};

export default function ServiceTransaction({
  onServiceSaved,
  fetchServiceTransactions,
}) {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    color: "success",
  });
  const [receiptData, setReceiptData] = useState(null);

  const sparepartCost = Number(formData.modal_sparepart) || 0;
  const jasaPengerjaan = Number(formData.jasa_pengerjaan) || 0;
  const totalBayar = sparepartCost + jasaPengerjaan;
  const labaService = jasaPengerjaan;

  const showNotif = (message, color = "success") => {
    setNotif({ open: true, message, color });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const payload = {
      pelanggan: formData.pelanggan || "-",
      no_hp: formData.no_hp || "-",
      perangkat: formData.perangkat,
      keluhan: formData.keluhan || "-",
      modal_sparepart: sparepartCost,
      sparepart: sparepartCost,
      sparepart_komponen: sparepartCost,
      harga_sparepart: sparepartCost,
      modal_pengerjaan: 0,
      total_modal: sparepartCost,
      catatan_modal: sparepartCost > 0 ? "Sparepart / komponen" : "-",
      harga_jasa: totalBayar,
      total_bayar: totalBayar,
      jasa_pengerjaan: jasaPengerjaan,
      laba: labaService,
      metode_pembayaran: formData.metode_pembayaran,
      catatan: "-",
    };

    const res = await api.addServiceTransaction(payload);

    if (res?.status === "success") {
      const receiptDate = new Date();
      const serviceItems = [
        {
          id_produk: "service-include",
          nama_produk: formData.keluhan || `Service ${formData.perangkat}`,
          jumlah: 1,
          harga_satuan: totalBayar,
          total_harga: totalBayar,
          keterangan: formData.garansi
            ? `${formData.perangkat} - Garansi ${formData.garansi}`
            : formData.perangkat,
        },
      ];

      setReceiptData({
        billNumber: `#${String(receiptDate.getTime()).slice(-4)}`,
        tanggal: formatReceiptDate(receiptDate),
        jam: formatReceiptTime(receiptDate),
        waktu: receiptDate.toLocaleString("id-ID"),
        items: serviceItems,
        total_harga: totalBayar,
        ongkir: 0,
        metode_pembayaran: formData.metode_pembayaran,
      });
      showNotif("Transaksi service berhasil dicatat.", "success");
      onServiceSaved?.(payload);
      fetchServiceTransactions?.({ isSilent: true, refreshKey: Date.now() });
      setFormData(initialForm);
    } else {
      showNotif(res?.message || "Gagal mencatat transaksi service.", "danger");
    }

    setLoading(false);
  };

  const receiptSubtotal = Number(receiptData?.total_harga) || 0;
  const receiptShipping = Number(receiptData?.ongkir) || 0;
  const receiptGrandTotal = receiptSubtotal + receiptShipping;
  const receiptItems = receiptData?.items || [];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6">
      <ReceiptModal
        receiptData={receiptData}
        receiptItems={receiptItems}
        receiptSubtotal={receiptSubtotal}
        receiptShipping={receiptShipping}
        receiptGrandTotal={receiptGrandTotal}
        onClose={() => setReceiptData(null)}
        onDownloadSuccess={() =>
          showNotif("Struk PNG berhasil diunduh.", "success")
        }
        onDownloadError={() => showNotif("Gagal membuat struk PNG.", "danger")}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-fontDark flex items-center gap-2">
            <Wrench className="text-blue-600" /> Transaksi Service
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Catat service dengan sparepart sebagai modal dan jasa sebagai laba.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 min-h-0">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-darkMode rounded-2xl shadow-sm border border-gray-100 dark:border-borderDark p-4 md:p-6 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-fontDark uppercase tracking-wider mb-2">
                Nama Pelanggan
              </label>
              <input
                name="pelanggan"
                value={formData.pelanggan}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[16px] font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Budi"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-fontDark uppercase tracking-wider mb-2">
                No. HP
              </label>
              <input
                name="no_hp"
                value={formData.no_hp}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[16px] font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-fontDark uppercase tracking-wider mb-2">
                Perangkat
              </label>
              <input
                name="perangkat"
                value={formData.perangkat}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[16px] font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Redmi Note 10"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-fontDark uppercase tracking-wider mb-2">
                Metode Pembayaran
              </label>
              <select
                name="metode_pembayaran"
                value={formData.metode_pembayaran}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tunai">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-fontDark uppercase tracking-wider mb-2">
                  Keluhan / Pekerjaan
                </label>
                <input
                  name="keluhan"
                  value={formData.keluhan}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[16px] font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Ganti LCD, baterai drop, konektor charger"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-fontDark uppercase tracking-wider mb-2">
                  Garansi
                </label>
                <input
                  name="garansi"
                  value={formData.garansi}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[16px] font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 7 hari"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-fontDark uppercase tracking-wider mb-2">
                Sparepart / Komponen
              </label>
              <input
                name="modal_sparepart"
                type="number"
                min="0"
                value={formData.modal_sparepart}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[16px] font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0 jika tidak ada yang diganti"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-fontDark uppercase tracking-wider mb-2">
                Jasa Pengerjaan
              </label>
              <input
                name="jasa_pengerjaan"
                type="number"
                min="0"
                value={formData.jasa_pengerjaan}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[16px] font-semibold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Laba service"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:bg-slate-300"
          >
            <Save size={18} /> Simpan Transaksi Service
          </button>
        </form>

        <div className="bg-white dark:bg-darkMode rounded-2xl shadow-sm border border-gray-100 dark:border-borderDark p-5 h-fit">
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <ClipboardCheck size={22} />
            <h2 className="font-semibold text-gray-800 dark:text-fontDark">
              Ringkasan
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-300">
                Sparepart / Modal
              </span>
              <span className="font-semibold text-gray-800 dark:text-fontDark">
                {formatRupiah(sparepartCost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-300">
                Jasa Pengerjaan
              </span>
              <span className="font-semibold text-blue-700">
                {formatRupiah(jasaPengerjaan)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-300">
                Total Bayar
              </span>
              <span className="font-semibold text-gray-800 dark:text-fontDark">
                {formatRupiah(totalBayar)}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-600 dark:text-gray-200">
                Laba Service
              </span>
              <span className="font-semibold text-green-600">
                {formatRupiah(labaService)}
              </span>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 flex gap-2 text-xs text-blue-700 font-semibold">
              <DollarSign size={16} className="shrink-0" />
              Total bayar dihitung dari sparepart ditambah jasa. Laba service
              sama dengan jasa pengerjaan.
            </div>
          </div>
        </div>
      </div>

      <LoadingModal open={loading} message="Menyimpan transaksi service..." />
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
  );
}

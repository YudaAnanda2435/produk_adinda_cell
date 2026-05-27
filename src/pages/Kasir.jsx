import { useState, useMemo, useEffect } from "react";
import {
  ShoppingCart,
  CheckCircle,
  Search,
  X,
  AlertOctagon,
  Printer,
  Wallet,
  QrCode,
  CreditCard,
  Package,
  Tags,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import Snackbar from "@mui/joy/Snackbar";
import * as api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import LoadingModal from "../components/LoadingModal";

// Komponen Skeleton khusus untuk halaman Kasir
const KasirSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0 flex-1 w-full animate-pulse">
    {/* SKELETON KIRI: Form Kasir */}
    <div className="w-full lg:w-[420px] shrink-0 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-fit space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
        <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
          <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
        </div>
        <div className="h-24 w-full bg-slate-200 rounded-xl"></div>
        <div>
          <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
          <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-100">
          <div className="h-14 w-full bg-slate-200 rounded-xl"></div>
          <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </div>

    {/* SKELETON KANAN: Katalog Produk */}
    <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-fit min-h-[500px] lg:min-h-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-6 w-40 bg-slate-200 rounded-lg mb-2"></div>
          <div className="h-3 w-48 bg-slate-200 rounded"></div>
        </div>
        <div className="h-10 w-64 bg-slate-200 rounded-xl hidden sm:block"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
        {/* Render 6 kotak skeleton sebagai bayangan produk */}
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="p-4 rounded-xl border-2 border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
              <div className="h-6 w-16 bg-slate-200 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Pastikan menerima props isLoading dari App.jsx
export default function Kasir({ products, fetchProducts, isLoading }) {
  const [selectedId, setSelectedId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [metodePembayaran, setMetodePembayaran] = useState("Tunai");
const [uangDiterima, setUangDiterima] = useState("");
  const [isRusakModalOpen, setIsRusakModalOpen] = useState(false); // State untuk Snackbar Joy UI
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarColor, setSnackbarColor] = useState("success");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  // const [formatRupiah, setTotalPayment] = useState(0);

  const bankAccounts = {
    BCA: { name: "BCA", accName: "Yuda", accNumber: "123456789" },
    Mandiri: { name: "Mandiri", accName: "Yuda", accNumber: "123456789" },
    BNI: { name: "BNI", accName: "Yuda", accNumber: "123456789" },
    SeaBank: { name: "SeaBank", accName: "Yuda", accNumber: "123456789" },
  };

  // Fungsi pemanggil Snackbar agar lebih ringkas
  const showNotif = (message, color = "success") => {
    setSnackbarMessage(message);
    setSnackbarColor(color);
    setOpenSnackbar(true);
  };

  const [visibleCount, setVisibleCount] = useState(12);

  const product = products.find((p) => String(p.id) === String(selectedId));

  const filteredProducts = useMemo(() => {
    if (searchTerm.trim().length < 3) return [];
    const lowerSearch = searchTerm.toLowerCase();
    return products.filter((p) =>
      `${p.merk} ${p.model} ${p.jenis_sparepart}`
        .toLowerCase()
        .includes(lowerSearch),
    );
  }, [products, searchTerm]);

  const catalogFiltered = useMemo(() => {
    const lowerSearch = catalogSearch.toLowerCase();
    return products.filter((p) =>
      `${p.merk} ${p.model} ${p.jenis_sparepart}`
        .toLowerCase()
        .includes(lowerSearch),
    );
  }, [products, catalogSearch]);

  useEffect(() => {
    setVisibleCount(12);
  }, [catalogSearch]);

  const displayedCatalog = catalogFiltered.slice(0, visibleCount);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka || 0);
  };

  const totalHarga = product ? product.harga_jual * jumlah : 0;
  // const kembalian = uangDiterima ? Number(uangDiterima) - totalHarga : 0;

  const handleSelectProduct = (p) => {
    if (p.stok < 1) return alert("Stok produk ini sedang kosong!");
    setSelectedId(p.id);
    setSearchTerm(`${p.merk} ${p.model} (${p.jenis_sparepart})`);
    setIsDropdownOpen(false);
    setJumlah(1);
  };

  const clearSelection = () => {
    setSelectedId("");
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleJual = async () => {
    if (!product || jumlah < 1)
      return showNotif("Pilih produk & jumlah valid!", "danger");
    if (jumlah > product.stok)
      return showNotif("Stok barang tidak mencukupi!", "danger");

    setLoadingMessage("Memproses transaksi penjualan...");
    setLoading(true);
    const labaSatuan = Number(product.harga_jual) - Number(product.harga_beli);
    const totalHargaCheckout = product.harga_jual * jumlah;

    const dataTransaksi = {
      id_produk: product.id,
      nama_produk: `${product.merk} ${product.model}`,
      jumlah: jumlah,
      total_harga: totalHargaCheckout,
      laba: labaSatuan * jumlah,
      keterangan: product.keterangan || "-",
      metode_pembayaran: metodePembayaran,
    };

    const res = await api.checkout(dataTransaksi);
    if (res.status === "success") {
      setReceiptData({
        ...dataTransaksi,
        harga_satuan: product.harga_jual,
        waktu: new Date().toLocaleString("id-ID"),
        kasir: "Admin",
      });
      clearSelection();
      setJumlah(1);
    } else {
      showNotif("Sistem gagal mencatat transaksi: " + res.message, "danger");
    }
    setLoading(false);
  };

  const handleRusakClick = () => {
    if (!product || jumlah < 1)
      return showNotif("Pilih produk & jumlah valid!", "danger");
    if (jumlah > product.stok)
      return showNotif("Stok barang tidak mencukupi!", "danger");

    setIsRusakModalOpen(true);
  };

  const executeRusak = async () => {
    setLoadingMessage("Mencatat laporan barang rusak...");
    setIsRusakModalOpen(false);
    setLoading(true);

    const kerugianModal = Number(product.harga_beli) * jumlah;

    const dataKerusakan = {
      id_produk: product.id,
      nama_produk: `[RUSAK] ${product.merk} ${product.model}`,
      jumlah: jumlah,
      total_harga: 0,
      laba: -kerugianModal,
      keterangan: product.keterangan || "-",
      metode_pembayaran: "-",
    };

    const res = await api.checkout(dataKerusakan);
    if (res.status === "success") {
      showNotif("Sistem berhasil mencatat barang rusak.", "success");
      fetchProducts(true);
      clearSelection();
      setJumlah(1);
    } else {
      showNotif("Sistem gagal mencatat kerusakan: " + res.message, "danger");
    }
    setLoading(false);
  };

  const cetakStruk = () => {
    window.print();
  };

  const tutupStruk = () => {
    setReceiptData(null);
    fetchProducts(true);
  };

  // KONDISI PENAMPILAN SKELETON
  if (isLoading) {
    return <KasirSkeleton />;
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-box, #receipt-box * { visibility: visible; }
          #receipt-box { position: absolute; left: 0; top: 0; width: 100%; max-width: 300px; margin: 0 auto; padding: 20px; box-shadow: none; }
        }
      `}</style>

      {receiptData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm print:bg-white print:static">
          <div
            id="receipt-box"
            className="bg-white p-6 rounded-2xl w-80 shadow-2xl print:shadow-none animate-in zoom-in-95 duration-200"
          >
            <div className="text-center mb-4 border-b pb-4 border-dashed border-gray-300">
              <h2 className="text-xl font-black text-gray-800">Stock SPerepart</h2>
              <p className="text-xs text-gray-500">
                Pusat Sparepart & Servis HP
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {receiptData.waktu}
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="text-sm font-bold text-gray-800">
                {receiptData.nama_produk}
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  {receiptData.jumlah} x Rp{" "}
                  {Number(receiptData.harga_satuan).toLocaleString("id-ID")}
                </span>
                <span>
                  Rp {Number(receiptData.total_harga).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center mb-6">
              <span className="font-bold text-gray-800">TOTAL</span>
              <span className="font-black text-lg text-gray-800">
                Rp {Number(receiptData.total_harga).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="text-center text-[10px] text-gray-500 mb-6">
              Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan
              selain klaim garansi resmi.
            </div>

            <div className="flex gap-3 print:hidden">
              <button
                onClick={tutupStruk}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={cetakStruk}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
              >
                <Printer size={16} /> Cetak
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0 flex-1">
        {/* KOLOM KIRI: Form Kasir */}
        <div className="w-full min-h-125 lg:min-h-0 lg:w-[420px] shrink-0 bg-white dark:bg-darkMode p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 flex flex-col  overflow-y-auto">
          <div className="flex items-center gap-3 mb-8 text-blue-600 dark:text-blue-400">
            <ShoppingCart size={28} />
            <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight">
              Kasir Konter
            </h1>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label className="block text-xs font-black text-gray-500 dark:text-fontDark uppercase tracking-wider mb-2">
                Produk Terpilih
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-3 pl-11 pr-10 bg-slate-50 border border-slate-200 rounded-[6px] outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-light text-gray-700"
                  placeholder="Ketik atau pilih dari katalog ➔"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    if (selectedId) setSelectedId("");
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                />
                <Search
                  size={18}
                  className="absolute left-4 top-4 text-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={clearSelection}
                    className="absolute right-3 top-3.5 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {isDropdownOpen &&
                searchTerm.trim().length >= 3 &&
                !selectedId && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onMouseDown={() => handleSelectProduct(p)}
                          className={`p-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-blue-50 transition-colors ${
                            p.stok < 1 ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-sm text-gray-800">
                                {p.merk} {p.model}
                              </div>
                              <div className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">
                                {p.jenis_sparepart}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-blue-600">
                                Rp{" "}
                                {Number(p.harga_jual).toLocaleString("id-ID")}
                              </div>
                              <div
                                className={`text-[10px] font-black uppercase mt-0.5 ${p.stok > 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                Sisa: {p.stok}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm font-medium text-gray-500">
                        Produk tidak ditemukan.
                      </div>
                    )}
                  </div>
                )}
            </div>

            {product && (
              <div className="p-5 bg-blue-50/50 rounded-xl space-y-3 border border-blue-100/50 animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-sm border-b border-blue-100/50 pb-2">
                  <span className="text-blue-800/70 font-semibold">
                    Harga Jual:
                  </span>
                  <span className="font-black text-blue-700 text-lg">
                    Rp {Number(product.harga_jual).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-800/70 font-semibold">
                    Harga Modal:
                  </span>
                  <span className="font-bold text-slate-500">
                    Rp {Number(product.harga_beli).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-800/70 font-semibold">
                    Stok Tersedia:
                  </span>
                  <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded shadow-sm">
                    {product.stok} Unit
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-gray-500 dark:text-fontDark uppercase tracking-wider mb-2">
                Jumlah Item
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setJumlah(Math.max(1, jumlah - 1))}
                  disabled={!product || jumlah <= 1}
                  className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white text-slate-600 dark:text-cardDark font-bold hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  className="flex-1 h-12 text-center border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-lg text-gray-800 dark:text-fontDark transition-all"
                  value={jumlah}
                  onChange={(e) => setJumlah(Number(e.target.value))}
                  min="1"
                  disabled={!product}
                />
                <button
                  type="button"
                  onClick={() =>
                    setJumlah(
                      product ? Math.min(product.stok, jumlah + 1) : jumlah + 1,
                    )
                  }
                  disabled={!product || jumlah >= (product?.stok || 0)}
                  className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white text-slate-600 dark:text-cardDark font-bold hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-100">
              {/* AREA METODE PEMBAYARAN */}
              {product && (
                <div className="order-t border-gray-100 space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                      Metode Pembayaran
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setMetodePembayaran("Tunai")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          metodePembayaran === "Tunai"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-500 hover:border-blue-200"
                        }`}
                      >
                        <Wallet size={20} className="mb-1" />
                        <span className="text-[11px] font-bold">Tunai</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetodePembayaran("QRIS")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          metodePembayaran === "QRIS"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-500 hover:border-blue-200"
                        }`}
                      >
                        <QrCode size={20} className="mb-1" />
                        <span className="text-[11px] font-bold">QRIS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetodePembayaran("Transfer")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          metodePembayaran === "Transfer"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-500 hover:border-blue-200"
                        }`}
                      >
                        <CreditCard size={20} className="mb-1" />
                        <span className="text-[11px] font-bold">Transfer</span>
                      </button>
                    </div>
                  </div>

                  {/* Input Uang Diterima (Hanya muncul jika bayar Tunai) */}
                  {/* 1. TUNAI */}
                  {metodePembayaran === "Tunai" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">
                          Jumlah Uang Diterima
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-slate-400 font-medium">
                              Rp
                            </span>
                          </div>
                          <input
                            type="number"
                            onWheel={(e) => e.target.blur()}
                            value={uangDiterima}
                            onChange={(e) => setUangDiterima(e.target.value)}
                            placeholder="0"
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white font-medium text-lg"
                          />
                        </div>
                      </div>

                      {/* Kembalian */}
                      <div className="flex justify-between items-center px-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Kembalian:
                        </span>
                        <span
                          className={`text-lg font-bold ${Number(uangDiterima) >= totalHarga ? "text-green-500" : "text-red-500"}`}
                        >
                          {Number(uangDiterima) > 0
                            ? formatRupiah(Number(uangDiterima) - totalHarga)
                            : formatRupiah(0)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. QRIS */}
                  {metodePembayaran === "QRIS" && (
                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 ">
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                        Tampilkan QRIS ke pelanggan untuk discan.
                      </p>
                      <button
                        onClick={() => setShowQrisModal(true)}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        Buka QRIS Sekarang
                      </button>
                    </div>
                  )}

                  {/* 3. TRANSFER BANK */}
                  {metodePembayaran === "Transfer" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300  flex flex-col justify-center">
                      <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">
                          Pilih Bank Tujuan
                        </label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white font-medium appearance-none cursor-pointer"
                        >
                          <option value="" disabled>
                            -- Pilih Bank --
                          </option>
                          <option value="BCA">Bank BCA</option>
                          <option value="Mandiri">Bank Mandiri</option>
                          <option value="BNI">Bank BNI</option>
                          <option value="SeaBank">SeaBank</option>
                        </select>
                      </div>

                      {/* Tampilan Nomor Rekening Muncul Jika Bank Dipilih */}
                      {selectedBank ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3.5 rounded-xl animate-in zoom-in-95 duration-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              {bankAccounts[selectedBank].name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              a.n {bankAccounts[selectedBank].accName}
                            </span>
                          </div>
                          <div className="text-xl font-bold text-slate-800 dark:text-white tracking-widest">
                            {bankAccounts[selectedBank].accNumber}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center text-sm text-slate-400 dark:text-slate-500">
                          Pilih bank untuk melihat detail rekening.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleJual}
                disabled={
                  loading ||
                  !product ||
                  (metodePembayaran === "Tunai" && uangDiterima < totalHarga)
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:bg-slate-300 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle size={20} /> Jual Sekarang
                  </>
                )}
              </button>

              <button
                onClick={handleRusakClick}
                disabled={loading || !product}
                className="w-full bg-white border-2 border-red-100 hover:border-red-600 text-red-600 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:border-red-100 hover:bg-red-50"
              >
                <AlertOctagon size={18} /> Catat Barang Rusak (Loss)
              </button>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Katalog Produk */}
        <div className="flex-1 bg-white dark:bg-darkMode p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-borderDark flex flex-col min-h-[500px] lg:min-h-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-fontDark">
                Katalog Produk
              </h2>
              <p className="text-sm text-gray-500 dark:text-fontDark mt-1">
                Pilih barang langsung dari daftar
              </p>
            </div>

            <div className="w-full sm:w-64 relative">
              <Search
                size={18}
                className="absolute left-3.5 top-3 text-gray-400 dark:text-cardDark"
              />
              <input
                type="text"
                placeholder="Cari merk, model, jenis..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full text-[16px] pl-10 pr-4 py-2.5  text-cardDark bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pr-2 pb-2">
            {displayedCatalog.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayedCatalog.map((p) => {
                    const isSelected = String(p.id) === String(selectedId);
                    const isOutOfStock = p.stok < 1;

                    return (
                      <div
                        key={p.id}
                        onClick={() => !isOutOfStock && handleSelectProduct(p)}
                        className={`relative p-4 rounded-xl border-2 transition-all group ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 dark:bg-darkMode shadow-md shadow-blue-100 dark:shadow-none"
                            : isOutOfStock
                              ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                              : "border-gray-100 dark:border-borderDark bg-white dark:bg-cardDark hover:border-blue-300 hover:shadow-md cursor-pointer"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-blue-600">
                            <CheckCircle size={20} className="fill-blue-100" />
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg mt-0.5 ${isSelected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 dark:bg-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500"}`}
                          >
                            <Package size={20} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 dark:text-fontDark pr-6 leading-tight">
                              {p.merk} {p.model}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Tags size={12} className="text-gray-400" />
                              <span className="text-[10px] font-black uppercase text-gray-500 dark:text-fontDark tracking-wider">
                                {p.jenis_sparepart}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-end justify-between pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">
                              Harga Jual
                            </p>
                            <p
                              className={`font-black ${isSelected ? "text-blue-700 dark:text-fontDark" : "text-gray-800 dark:text-fontDark"}`}
                            >
                              Rp {Number(p.harga_jual).toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div
                            className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                              isOutOfStock
                                ? "bg-red-100 text-red-600"
                                : isSelected
                                  ? "bg-blue-200 text-blue-800"
                                  : p.stok < 6
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isOutOfStock ? "HABIS" : `Stok: ${p.stok}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tombol Load More (Lihat Lainnya) */}
                {visibleCount < catalogFiltered.length && (
                  <div className="mt-8 flex justify-center pb-4">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold px-6 py-2.5 rounded-xl transition-all"
                    >
                      Lihat Lainnya <ChevronDown size={18} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-2xl">
                <Package size={48} className="text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">
                  Produk tidak ditemukan di katalog.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Coba gunakan kata kunci lain seperti merk atau jenis.
                </p>
              </div>
            )}
          </div>
        </div>
        {/* --- MODAL QRIS LAYAR PENUH --- */}
        {showQrisModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop Blur */}
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setShowQrisModal(false)}
            />

            {/* Konten QRIS */}
            <div className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300 max-w-sm w-[90%] border border-gray-100 dark:border-slate-700">
              {/* Tombol Tutup Silang di Sudut */}
              <button
                onClick={() => setShowQrisModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-700 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Scan QRIS
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
                Silakan scan kode di bawah ini menggunakan aplikasi M-Banking
                atau e-Wallet Anda.
              </p>

              {/* Ganti dengan gambar QRIS asli Anda */}
              <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" // GANTI DENGAN URL QRIS ANDA
                  alt="QRIS Toko"
                  className="w-56 h-56 object-contain"
                />
              </div>

              <p className="mt-6 text-xl font-bold text-blue-600 dark:text-blue-400">
                Total: {formatRupiah(totalHarga)}
              </p>
            </div>
          </div>
        )}
        {/* Letakkan sebelum penutup fragmen utama */}
        <ConfirmModal
          open={isRusakModalOpen}
          onClose={() => setIsRusakModalOpen(false)}
          onConfirm={executeRusak}
          title="Catat Barang Rusak?"
          message={`Anda akan mencatat ${jumlah} unit ${product?.merk} ${product?.model} sebagai barang rusak. Sistem akan memotong stok dan mengurangi laba bersih senilai kerugian modal. Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Ya, Catat Kerusakan"
          cancelText="Batal"
          color="danger"
        />
        {/* Snackbar Joy UI */}
        <Snackbar
          autoHideDuration={3000}
          open={openSnackbar}
          variant="solid"
          color={snackbarColor}
          onClose={(event, reason) => {
            if (reason === "clickaway") return;
            setOpenSnackbar(false);
          }}
          startDecorator={
            snackbarColor === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )
          }
        >
          <span className="font-semibold text-sm">{snackbarMessage}</span>
        </Snackbar>
        <LoadingModal open={loading} message={loadingMessage} />
      </div>
    </>
  );
}

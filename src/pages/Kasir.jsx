import { useState, useMemo } from "react";
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
  Trash2,
} from "lucide-react";
import Snackbar from "@mui/joy/Snackbar";
import * as api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import LoadingModal from "../components/LoadingModal";

const toSearchText = (value) =>
  value === null || value === undefined ? "" : String(value).toLowerCase();

const getProductSearchText = (product) =>
  toSearchText(
    `${product.merk || ""} ${product.model || ""} ${
      product.jenis_sparepart || ""
    }`,
  );

const RECEIPT_LOGO_SRC = "/adinda.png";
const RECEIPT_STORE_NAME = "ADINDA CELLULAR";
const RECEIPT_ADDRESS_LINES = [
  "Jln.pasir ipis surade ",
  "(pertigaan smk bina bangsa)",
];
const RECEIPT_CONTACT = "Contact: 0858-8040-4783";

const formatReceiptAmount = (value) =>
  Number(value || 0).toLocaleString("id-ID");

const formatReceiptDate = (date = new Date()) =>
  date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatReceiptTime = (date = new Date()) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

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
    <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-fit min-h-[580px] lg:min-h-0">
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
export default function Kasir({
  products,
  fetchProducts,
  onTransactionSaved,
  isLoading,
}) {
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
  const [cartItems, setCartItems] = useState([]);
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
    const lowerSearch = toSearchText(searchTerm);
    return products
      .filter((p) => getProductSearchText(p).includes(lowerSearch))
      .slice(0, 20);
  }, [products, searchTerm]);

  const catalogFiltered = useMemo(() => {
    const lowerSearch = toSearchText(catalogSearch);
    if (!lowerSearch) return products;
    return products.filter((p) => getProductSearchText(p).includes(lowerSearch));
  }, [products, catalogSearch]);

  const displayedCatalog = catalogFiltered.slice(0, visibleCount);
  const selectedProductCartQty = cartItems
    .filter((item) => String(item.id_produk) === String(selectedId))
    .reduce((sum, item) => sum + item.jumlah, 0);
  const selectedProductAvailable = product
    ? Math.max(0, Number(product.stok) - selectedProductCartQty)
    : 0;

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka || 0);
  };

  const totalHarga = cartItems.reduce(
    (sum, item) => sum + Number(item.total_harga || 0),
    0,
  );
  const totalCartQty = cartItems.reduce(
    (sum, item) => sum + Number(item.jumlah || 0),
    0,
  );
  // const kembalian = uangDiterima ? Number(uangDiterima) - totalHarga : 0;

  const handleSelectProduct = (p) => {
    if (p.stok < 1) return alert("Stok produk ini sedang kosong!");
    const existingQty = cartItems
      .filter((item) => String(item.id_produk) === String(p.id))
      .reduce((sum, item) => sum + item.jumlah, 0);
    if (existingQty >= Number(p.stok || 0)) {
      showNotif("Stok produk ini sudah masuk semua ke keranjang.", "danger");
      return;
    }

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

  const handleAddToCart = () => {
    if (!product || jumlah < 1)
      return showNotif("Pilih produk & jumlah valid!", "danger");
    if (jumlah > selectedProductAvailable)
      return showNotif("Stok barang tidak mencukupi!", "danger");

    const labaSatuan = Number(product.harga_jual) - Number(product.harga_beli);
    const cartItem = {
      id_produk: product.id,
      nama_produk: `${product.merk} ${product.model}`,
      jenis_sparepart: product.jenis_sparepart || "-",
      jumlah,
      harga_satuan: Number(product.harga_jual) || 0,
      total_harga: (Number(product.harga_jual) || 0) * jumlah,
      laba: labaSatuan * jumlah,
      keterangan: product.keterangan || "-",
    };

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => String(item.id_produk) === String(product.id),
      );

      if (!existingItem) return [...currentItems, cartItem];

      return currentItems.map((item) => {
        if (String(item.id_produk) !== String(product.id)) return item;
        const nextQty = item.jumlah + jumlah;
        return {
          ...item,
          jumlah: nextQty,
          total_harga: item.harga_satuan * nextQty,
          laba: labaSatuan * nextQty,
        };
      });
    });

    showNotif("Produk masuk ke keranjang.", "success");
    clearSelection();
    setJumlah(1);
  };

  const updateCartQty = (idProduk, nextQty) => {
    const sourceProduct = products.find(
      (item) => String(item.id) === String(idProduk),
    );
    const maxQty = Number(sourceProduct?.stok) || 1;
    const safeQty = Math.max(1, Math.min(maxQty, Number(nextQty) || 1));

    setCartItems((currentItems) =>
      currentItems.map((item) => {
        if (String(item.id_produk) !== String(idProduk)) return item;
        const unitProfit =
          Number(sourceProduct?.harga_jual || item.harga_satuan) -
          Number(sourceProduct?.harga_beli || 0);
        return {
          ...item,
          jumlah: safeQty,
          total_harga: item.harga_satuan * safeQty,
          laba: unitProfit * safeQty,
        };
      }),
    );
  };

  const removeCartItem = (idProduk) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => String(item.id_produk) !== String(idProduk)),
    );
  };

  const handleJual = async () => {
    if (cartItems.length === 0)
      return showNotif("Keranjang masih kosong.", "danger");
    if (metodePembayaran === "Tunai" && Number(uangDiterima) < totalHarga)
      return showNotif("Uang diterima masih kurang.", "danger");

    setLoadingMessage("Memproses transaksi penjualan...");
    setLoading(true);

    const transactionItems = cartItems.map((item) => ({
      id_produk: item.id_produk,
      nama_produk: item.nama_produk,
      jumlah: item.jumlah,
      total_harga: item.total_harga,
      laba: item.laba,
      keterangan: item.keterangan || "-",
      metode_pembayaran: metodePembayaran,
    }));

    try {
      for (const transactionItem of transactionItems) {
        const res = await api.checkout(transactionItem);
        if (res.status !== "success") {
          throw new Error(res.message || "Gagal mencatat salah satu produk.");
        }
        onTransactionSaved?.(transactionItem);
      }

      const receiptDate = new Date();
      setReceiptData({
        nama_produk: transactionItems.map((item) => item.nama_produk).join(", "),
        jumlah: totalCartQty,
        total_harga: totalHarga,
        laba: transactionItems.reduce(
          (sum, item) => sum + Number(item.laba || 0),
          0,
        ),
        items: cartItems,
        metode_pembayaran: metodePembayaran,
        billNumber: `#${String(receiptDate.getTime()).slice(-4)}`,
        tanggal: formatReceiptDate(receiptDate),
        jam: formatReceiptTime(receiptDate),
        ongkir: 0,
        waktu: receiptDate.toLocaleString("id-ID"),
        kasir: "Admin",
      });
      setCartItems([]);
      clearSelection();
      setJumlah(1);
      setUangDiterima("");
      fetchProducts(true);
    } catch (error) {
      showNotif("Sistem gagal mencatat transaksi: " + error.message, "danger");
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
      onTransactionSaved?.(dataKerusakan);
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

  const receiptSubtotal = Number(receiptData?.total_harga) || 0;
  const receiptShipping = Number(receiptData?.ongkir) || 0;
  const receiptGrandTotal = receiptSubtotal + receiptShipping;
  const receiptItems =
    receiptData?.items?.length > 0
      ? receiptData.items
      : receiptData
        ? [
            {
              id_produk: receiptData.id_produk,
              nama_produk: receiptData.nama_produk,
              jumlah: receiptData.jumlah,
              harga_satuan: receiptData.harga_satuan,
              total_harga: receiptData.total_harga,
              keterangan: receiptData.keterangan,
            },
          ]
        : [];

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
            padding: 5mm 4mm !important;
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

      {receiptData && (
        <div className="receipt-preview-shell fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm print:static print:block print:bg-white print:p-0">
          <div
            id="receipt-box"
            className="w-[320px] bg-[#faf8ef] px-6 py-7 text-slate-900 shadow-2xl animate-in zoom-in-95 duration-200 print:w-[58mm] print:bg-white print:shadow-none"
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
                className="mx-auto mb-3 h-14 w-auto object-contain grayscale"
              />
              <h2 className="text-[22px] font-black leading-none tracking-[0.08em]">
                {RECEIPT_STORE_NAME}
              </h2>
              <div className="mt-2 text-[11px] font-bold leading-tight text-slate-700">
                {RECEIPT_ADDRESS_LINES.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>{RECEIPT_CONTACT}</p>
              </div>
            </div>

            <div className="my-3 border-t border-dashed border-slate-500" />

            <div className="flex items-start justify-between text-[12px] font-bold leading-tight">
              <span>Bill {receiptData.billNumber}</span>
              <span className="text-right">
                {receiptData.tanggal} {receiptData.jam}
              </span>
            </div>

            <div className="my-3 border-t border-dashed border-slate-500" />

            <div className="space-y-2 text-[12px] font-bold leading-tight">
              <div className="flex items-end justify-between gap-3 pt-1">
                <span>Item x Qty</span>
                <span>Rate</span>
              </div>
              {receiptItems.map((item, index) => (
                <div key={`${item.id_produk}-${index}`} className="space-y-1">
                  <div className="flex items-end justify-between gap-3">
                    <span className="max-w-[170px] break-words">
                      {item.nama_produk}
                    </span>
                    <span className="shrink-0">
                      {formatReceiptAmount(item.total_harga)}
                    </span>
                  </div>
                  {item.keterangan && item.keterangan !== "-" && (
                    <div className="max-w-[170px] break-words text-slate-700">
                      ({item.keterangan})
                    </div>
                  )}
                  <div className="flex items-end justify-between gap-3 text-slate-700">
                    <span>
                      {item.jumlah} x {formatReceiptAmount(item.harga_satuan)}
                    </span>
                    <span>{formatReceiptAmount(item.total_harga)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="my-3 border-t border-dashed border-slate-500" />

            <div className="space-y-1 text-[13px] font-black leading-tight">
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

            <div className="my-3 border-t border-dashed border-slate-500" />

            <div className="pt-3 text-center text-[14px] font-black tracking-wider">
              TERIMA KASIH
            </div>

            <div className="receipt-actions mt-6 flex gap-3 print:hidden">
              <button
                onClick={tutupStruk}
                className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Tutup
              </button>
              <button
                onClick={cetakStruk}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700"
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
                    {selectedProductAvailable} Unit
                  </span>
                </div>
                {selectedProductCartQty > 0 && (
                  <div className="flex justify-between items-center text-xs text-blue-800/70">
                    <span>Sudah di keranjang:</span>
                    <span className="font-black">{selectedProductCartQty} Unit</span>
                  </div>
                )}
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
                  max={selectedProductAvailable || 1}
                  disabled={!product}
                />
                <button
                  type="button"
                  onClick={() =>
                    setJumlah(
                      product
                        ? Math.min(selectedProductAvailable, jumlah + 1)
                        : jumlah + 1,
                    )
                  }
                  disabled={!product || jumlah >= selectedProductAvailable}
                  className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white text-slate-600 dark:text-cardDark font-bold hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={loading || !product || selectedProductAvailable < 1}
              className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition-all hover:bg-slate-800 disabled:bg-slate-300 disabled:shadow-none"
            >
              Tambah ke Keranjang
            </button>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-borderDark dark:bg-cardDark">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-blue-600" />
                  <h2 className="text-sm font-black text-slate-800 dark:text-fontDark">
                    Keranjang
                  </h2>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black text-blue-700">
                  {totalCartQty} ITEM
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs font-semibold text-slate-400">
                  Belum ada produk di keranjang.
                </div>
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
                  {cartItems.map((item) => {
                    const sourceProduct = products.find(
                      (source) => String(source.id) === String(item.id_produk),
                    );
                    const maxQty = Number(sourceProduct?.stok) || item.jumlah;

                    return (
                      <div
                        key={item.id_produk}
                        className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-800">
                              {item.nama_produk}
                            </p>
                            <p className="mt-0.5 text-[11px] font-bold uppercase text-slate-400">
                              {item.jenis_sparepart}
                            </p>
                          </div>
                          <button
                            onClick={() => removeCartItem(item.id_produk)}
                            className="shrink-0 rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Hapus dari keranjang"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateCartQty(item.id_produk, item.jumlah - 1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-600 disabled:opacity-40"
                              disabled={item.jumlah <= 1}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={maxQty}
                              value={item.jumlah}
                              onChange={(event) =>
                                updateCartQty(item.id_produk, event.target.value)
                              }
                              className="h-8 w-14 rounded-lg border border-slate-200 text-center text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() =>
                                updateCartQty(item.id_produk, item.jumlah + 1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-600 disabled:opacity-40"
                              disabled={item.jumlah >= maxQty}
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400">
                              Subtotal
                            </p>
                            <p className="text-sm font-black text-blue-700">
                              {formatRupiah(item.total_harga)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-sm font-bold text-slate-500 dark:text-fontDark">
                  Total Keranjang
                </span>
                <span className="text-lg font-black text-blue-700">
                  {formatRupiah(totalHarga)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-100">
              {/* AREA METODE PEMBAYARAN */}
              {cartItems.length > 0 && (
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
                  cartItems.length === 0 ||
                  (metodePembayaran === "Tunai" && uangDiterima < totalHarga)
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:bg-slate-300 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle size={20} /> Bayar Sekarang
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
        <div className="flex-1 bg-white dark:bg-darkMode p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-borderDark flex flex-col min-h-[580px] lg:min-h-0 overflow-hidden">
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
                onChange={(e) => {
                  setCatalogSearch(e.target.value);
                  setVisibleCount(12);
                }}
                className="w-full text-[16px] pl-10 pr-4 py-2.5  text-cardDark bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 pb-24 md:pb-4 [-webkit-overflow-scrolling:touch]">
            {displayedCatalog.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayedCatalog.map((p) => {
                    const isSelected = String(p.id) === String(selectedId);
                    const qtyInCart = cartItems
                      .filter((item) => String(item.id_produk) === String(p.id))
                      .reduce((sum, item) => sum + item.jumlah, 0);
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
                        {!isSelected && qtyInCart > 0 && (
                          <div className="absolute top-3 right-3 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black text-white shadow-sm">
                            x{qtyInCart}
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

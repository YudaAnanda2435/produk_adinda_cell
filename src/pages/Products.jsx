import { useState } from "react";
import {
  Plus,
  Search,
  AlertTriangle,
  Edit,
  CheckCircle2,
  Trash2,
  X,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import * as api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import LoadingModal from "../components/LoadingModal";
import Snackbar from "@mui/joy/Snackbar";

const calculateProfit = (hargaJual, hargaBeli) =>
  Number(hargaJual) - Number(hargaBeli);

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const toSearchText = (value) =>
  value === null || value === undefined ? "" : String(value).toLowerCase();

const defaultProductFormData = {
  merk: "",
  model: "",
  jenis_sparepart: "",
  stok: 0,
  harga_beli: 0,
  harga_jual: 0,
  keterangan: "",
};

const ProductTable = ({ products, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-borderDark flex-1 min-h-[58dvh] md:min-h-0 flex flex-col overflow-hidden">
    <div className="overflow-y-auto flex-1 no-scrollbar">
      <table className="w-full text-left whitespace-nowrap relative">
        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10 shadow-sm border-b border-gray-200 outline outline-1 outline-gray-200">
          <tr className="text-gray-600 dark:text-fontDark text-sm">
            <th className="p-4 font-semibold">Produk</th>
            <th className="p-4 font-semibold">Jenis</th>
            <th className="p-4 font-semibold">Stok</th>
            <th className="p-4 font-semibold">Harga Modal</th>
            <th className="p-4 font-semibold">Harga Jual</th>
            <th className="p-4 font-semibold">Keuntungan</th>
            {/* TAMBAHAN: Judul Kolom Keterangan */}
            <th className="p-4 font-semibold">Keterangan</th>
            <th className="p-4 font-semibold text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.length === 0 ? (
            <tr>
              <td colSpan="8" className="p-8 text-center text-gray-500">
                Tidak ada produk ditemukan.
              </td>
            </tr>
          ) : (
            products.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-darkMode transition-colors">
                <td className="p-4">
                  <div className="font-medium text-gray-800 dark:text-fontDark">
                    {item.merk}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-fontDark">
                    {item.model}
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-600 dark:text-fontDark">
                  {item.jenis_sparepart}
                </td>
                <td className="p-4">
                  <div className="flex items-center">
                    <span
                      className={`font-bold ${item.stok < 6 ? "text-red-600" : "text-green-600"}`}
                    >
                      {item.stok}
                    </span>
                    {item.stok < 6 && (
                      <span className="ml-2 flex items-center text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase tracking-wider font-bold">
                        <AlertTriangle size={10} className="mr-1" /> Menipis
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-600 dark:text-fontDark">
                  {formatRupiah(item.harga_beli)}
                </td>
                <td className="p-4 text-sm text-gray-800 dark:text-fontDark font-medium">
                  {formatRupiah(item.harga_jual)}
                </td>
                <td className="p-4 text-sm text-green-600 font-medium">
                  {formatRupiah(
                    item.keuntungan ||
                      calculateProfit(item.harga_jual, item.harga_beli),
                  )}
                </td>
                {/* TAMBAHAN: Sel Isi Keterangan */}
                <td className="p-4 text-sm text-gray-500 dark:text-fontDark max-w-[200px] truncate">
                  {item.keterangan || "-"}
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const ProductForm = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState(() => ({
    ...defaultProductFormData,
    ...initialData,
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const keuntungan = calculateProfit(formData.harga_jual, formData.harga_beli);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[60vh] md:max-h-[90vh]"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? "Edit Data Produk" : "Tambah Produk Baru"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-5 z-50 overflow-y-auto flex-1">
          <div>
            <label className="block text-[16px] font-bold text-gray-700 mb-1.5">
              Merk HP
            </label>
            <input
              name="merk"
              value={formData.merk}
              onChange={handleChange}
              placeholder="Contoh: Samsung"
              className="w-full p-2.5 text-[16px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Model / Tipe HP
            </label>
            <input
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="Contoh: A51"
              className="w-full p-2.5 text-[16px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Jenis Sparepart
            </label>
            <select
              name="jenis_sparepart"
              value={formData.jenis_sparepart}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
              required
            >
              <option value="">Pilih Jenis...</option>
              <option value="LCD">LCD</option>
              <option value="Baterai">Baterai</option>
              <option value="Baterai B+">Baterai B+</option>
              <option value="Back Glass">Back Glass</option>
              <option value="Flexi On Off">Flexi On Off</option>
              <option value="Flexi Board Cas">Flexi Board Cas</option>
              <option value="Board Cas">Board Cas</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Jumlah Stok
            </label>
            <input
              name="stok"
              type="number"
              min="0"
              value={formData.stok}
              onChange={handleChange}
              className="w-full text-[16px] p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-blue-600 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Harga Beli (Rp)
            </label>
            <input
              name="harga_beli"
              type="number"
              min="0"
              value={formData.harga_beli}
              onChange={handleChange}
              className="w-full text-[16px] p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Harga Jual (Rp)
            </label>
            <input
              name="harga_jual"
              type="number"
              min="0"
              value={formData.harga_jual}
              onChange={handleChange}
              className="w-full text-[16px] p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Keterangan Tambahan
            </label>
            <input
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              placeholder="Kondisi, garansi, atau catatan khusus"
              className="w-full text-[16px] p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center shadow-sm">
              <div className="bg-white p-1.5 rounded-lg mr-3 shadow-sm">
                <DollarSign size={18} className="text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                  Estimasi Laba Kotor per Item
                </span>
                <span className="text-lg font-black text-blue-700">
                  {formatRupiah(keuntungan)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 font-bold text-sm transition-all shadow-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm transition-all shadow-sm shadow-blue-200"
          >
            Simpan Produk
          </button>
        </div>
      </form>
    </div>
  );
};

export default function Products({
  products = [],
  fetchProducts,
  setProducts,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchMerk, setSearchMerk] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [filterJenis, setFilterJenis] = useState("");

  const [deleteId, setDeleteId] = useState(null);

  // State untuk Loading Modal
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // State untuk Snackbar
  const [notif, setNotif] = useState({
    open: false,
    message: "",
    color: "success",
  });

  const showNotif = (message, color = "success") => {
    setNotif({ open: true, message, color });
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data) => {
    setIsFormOpen(false); // Tutup form seketika

    // Tentukan pesan loading dan buka modal
    setLoadingMessage(
      editingProduct ? "Menyimpan perubahan..." : "Menambahkan produk baru...",
    );
    setLoading(true);

    const previousProducts = [...products];

    if (editingProduct) {
      // OPTIMISTIC UPDATE: Edit di layar langsung
      const updatedData = { ...data, id: editingProduct.id };
      setProducts(
        products.map((p) => (p.id === editingProduct.id ? updatedData : p)),
      );

      // Kirim ke server di latar belakang
      const res = await api.updateProduct(updatedData);
      if (res && res.status === "error") {
        setProducts(previousProducts); // Kembalikan jika gagal
        showNotif("Gagal mengupdate data di server.", "danger");
      } else {
        showNotif("Data produk berhasil diperbarui!", "success");
        fetchProducts(true); // Silent refresh
      }
    } else {
      // OPTIMISTIC UPDATE: Tambah di layar langsung
      const newId = new Date().getTime().toString(); // Buat ID sementara
      const newData = { ...data, id: newId };
      setProducts([newData, ...products]);

      // Kirim ke server di latar belakang
      const res = await api.addProduct(newData);
      if (res && res.status === "error") {
        setProducts(previousProducts); // Hapus jika gagal
        showNotif("Gagal menambah data ke server.", "danger");
      } else {
        showNotif("Produk baru berhasil ditambahkan!", "success");
        fetchProducts(true); // Silent refresh
      }
    }

    setLoading(false); // Tutup modal loading
  };

  const executeDelete = async () => {
    if (!deleteId) return;

    const targetId = deleteId;
    setDeleteId(null); // Tutup modal konfirmasi seketika

    setLoadingMessage("Menghapus suku cadang...");
    setLoading(true);

    const previousProducts = [...products];

    // OPTIMISTIC UPDATE: Hapus dari layar (UI) langsung
    setProducts(products.filter((p) => p.id !== targetId));

    // Eksekusi hapus di server
    const res = await api.deleteProduct(targetId);
    if (res && res.status === "error") {
      setProducts(previousProducts); // Kembalikan jika error
      showNotif("Gagal menghapus data di server.", "danger");
    } else {
      showNotif("Suku cadang berhasil dihapus!", "success");
      fetchProducts(true); // Silent refresh
    }

    setLoading(false); // Tutup modal loading
  };

  const filteredProducts = products.filter((p) => {
    const matchMerk = toSearchText(p.merk).includes(
      toSearchText(searchMerk),
    );
    const matchModel = toSearchText(p.model).includes(
      toSearchText(searchModel),
    );
    const matchJenis = filterJenis ? p.jenis_sparepart === filterJenis : true;
    return matchMerk && matchModel && matchJenis;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-6">
      <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-fontDark flex items-center gap-2">
          Manajemen Gudang
        </h1>
        <button
          onClick={handleOpenAdd}
          className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all font-bold text-sm w-full sm:w-auto justify-center"
        >
          <Plus size={18} className="mr-2" /> Tambah Suku Cadang
        </button>
      </div>

      <div className="shrink-0 bg-white dark:bg-darkMode p-4 rounded-xl shadow-sm border border-gray-100 dark:border-borderDark flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari merk HP..."
            value={searchMerk}
            onChange={(e) => setSearchMerk(e.target.value)}
            className="w-full text-[16px] bg-white pl-10 pr-3 py-2.5 dark:text-darkMode border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
          />
        </div>
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3.5 top-3 text-gray-400 dark:text-darkMode"
          />
          <input
            type="text"
            placeholder="Cari model HP..."
            value={searchModel}
            onChange={(e) => setSearchModel(e.target.value)}
            className="w-full text-[16px] bg-white pl-10 pr-3 py-2.5 dark:text-darkMode border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-all"
          />
        </div>
        <div className="flex-1">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full px-3 py-3! border bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-600 transition-all cursor-pointer"
          >
            <option value="">Semua Kategori Sparepart</option>
            <option value="LCD">LCD</option>
            <option value="Baterai">Baterai</option>
            <option value="Baterai B+">Baterai B+</option>
            <option value="Back Glass">Back Glass</option>
            <option value="Flexi On Off">Flexi On Off</option>
            <option value="Flexi Board Cas">Flexi Board Cas</option>
            <option value="Board Cas">Board Cas</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
      </div>

      <ProductTable
        products={filteredProducts}
        onEdit={handleOpenEdit}
        onDelete={(id) => setDeleteId(id)}
      />

      {isFormOpen && (
        <ProductForm
          key={editingProduct?.id || "new-product"}
          onSubmit={handleSubmit}
          initialData={editingProduct}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={executeDelete}
        title="Hapus Suku Cadang?"
        message="Yakin ingin menghapus produk ini dari gudang? Tindakan ini tidak dapat dibatalkan dan memengaruhi data stok."
        confirmText="Hapus Permanen"
        cancelText="Batal"
        color="danger"
      />

      {/* MODAL LOADING PROSES */}
      <LoadingModal open={loading} message={loadingMessage} />

      {/* SNACKBAR NOTIFIKASI */}
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

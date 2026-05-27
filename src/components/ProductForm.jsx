import { useEffect, useState } from "react";
import { X, DollarSign } from "lucide-react";

const calculateProfit = (hargaJual, hargaBeli) => {
  return Number(hargaJual) - Number(hargaBeli);
};

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const ProductForm = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    merk: "",
    model: "",
    jenis_sparepart: "",
    stok: 0,
    harga_beli: 0,
    harga_jual: 0,
    keterangan: "",
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? "Edit Produk" : "Tambah Produk Baru"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Merk HP
            </label>
            <input
              name="merk"
              value={formData.merk}
              onChange={handleChange}
              placeholder="Contoh: Samsung"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model / Tipe HP
            </label>
            <input
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="Contoh: A51"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Sparepart
            </label>
            <select
              name="jenis_sparepart"
              value={formData.jenis_sparepart}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Pilih Jenis...</option>
              <option value="LCD">LCD / Touchscreen</option>
              <option value="Baterai">Baterai</option>
              <option value="Konektor Charger">Konektor Charger</option>
              <option value="Fleksibel On/Off">Fleksibel On/Off</option>
              <option value="Kamera">Kamera</option>
              <option value="Speaker">Speaker</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Stok
            </label>
            <input
              name="stok"
              type="number"
              min="0"
              value={formData.stok}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga Beli (Rp)
            </label>
            <input
              name="harga_beli"
              type="number"
              min="0"
              value={formData.harga_beli}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga Jual (Rp)
            </label>
            <input
              name="harga_jual"
              type="number"
              min="0"
              value={formData.harga_jual}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan Tambahan
            </label>
            <input
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              placeholder="Kondisi, garansi, atau catatan khusus"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="p-3 bg-blue-50 text-blue-800 rounded-lg flex items-center">
            <DollarSign size={20} className="mr-2" />
            <span>
              Estimasi Keuntungan per item:{" "}
              <strong>{formatRupiah(keuntungan)}</strong>
            </span>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Simpan Produk
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;

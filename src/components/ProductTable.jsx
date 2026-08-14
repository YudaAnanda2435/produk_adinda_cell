import { AlertTriangle, Edit, Trash2 } from "lucide-react";

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

const ProductTable = ({ products, onEdit, onDelete }) => (
  <div className="bg-white  rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left whitespace-nowrap">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-sm border-b">
            <th className="p-4 font-semibold">Produk</th>
            <th className="p-4 font-semibold">Jenis</th>
            <th className="p-4 font-semibold">Stok</th>
            <th className="p-4 font-semibold">Harga Modal</th>
            <th className="p-4 font-semibold">Harga Jual</th>
            <th className="p-4 font-semibold">Keuntungan</th>
            <th className="p-4 font-semibold text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.length === 0 ? (
            <tr>
              <td colSpan="7" className="p-8 text-center text-gray-500">
                Tidak ada produk ditemukan.
              </td>
            </tr>
          ) : (
            products.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-gray-800">{item.merk}</div>
                  <div className="text-xs text-gray-500">{item.model}</div>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {item.jenis_sparepart}
                </td>
                <td className="p-4">
                  <div className="flex items-center">
                    <span
                      className={`font-semibold ${item.stok < 3 ? "text-red-600" : "text-green-600"}`}
                    >
                      {item.stok}
                    </span>
                    {item.stok < 3 && (
                      <span className="ml-2 flex items-center text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase tracking-wider font-semibold">
                        <AlertTriangle size={10} className="mr-1" /> Menipis
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {formatRupiah(item.harga_beli)}
                </td>
                <td className="p-4 text-sm text-gray-800 font-medium">
                  {formatRupiah(item.harga_jual)}
                </td>
                <td className="p-4 text-sm text-green-600 font-medium">
                  {formatRupiah(
                    item.keuntungan ||
                      calculateProfit(item.harga_jual, item.harga_beli),
                  )}
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
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

export default ProductTable;

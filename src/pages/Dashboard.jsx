import { useMemo, useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  Layers,
  Calendar,
} from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);
};

// Komponen animasi angka
const AnimatedNumber = ({ targetValue, formatter, duration = 2500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = Number(targetValue) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      
      // Hitung persentase waktu yang berjalan (0 hingga 1)
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Rumus deselerasi (Ease-Out) agar putaran angka melambat saat mendekati target
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetValue, duration]);

  return <>{formatter ? formatter(count) : count}</>;
};

const DashboardCard = ({ title, value, icon, colorClass, subtitle }) => (
  <div className="bg-white dark:bg-darkMode p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-darkMode flex items-center space-x-4 transition-all hover:shadow-md">
    <div className={`p-4 rounded-xl ${colorClass} shadow-sm`}>{icon}</div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-100 font-bold">
        {title}
      </p>
      <h3 className="text-[16px] font-bold text-gray-800 dark:text-gray-100">
        {value}
      </h3>
      {subtitle && (
        <p className="text-[10px] text-gray-500 dark:text-gray-200 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

const Dashboard = ({ products = [], transactions = [] }) => {
const hariIni = new Date().toISOString().split("T")[0];

// --- PERUBAHAN: Baca memori browser untuk state awal ---
const [startDate, setStartDate] = useState(() => {
  return localStorage.getItem("dashboardStartDate") || hariIni;
});
const [endDate, setEndDate] = useState(() => {
  return localStorage.getItem("dashboardEndDate") || hariIni;
});
  const [isDateOpen, setIsDateOpen] = useState(false);
  useEffect(() => {
    localStorage.setItem("dashboardStartDate", startDate);
    localStorage.setItem("dashboardEndDate", endDate);
  }, [startDate, endDate]);

  const filteredTransactions = useMemo(() => {
    if (!startDate || !endDate) return transactions;

    const startWaktu = new Date(startDate).setHours(0, 0, 0, 0);
    const endWaktu = new Date(endDate).setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const tglTrans = new Date(t.tanggal).getTime();
      return tglTrans >= startWaktu && tglTrans <= endWaktu;
    });
  }, [transactions, startDate, endDate]);

  const stats = useMemo(() => {
    const totalJenis = products.length;
    const totalStokGudang = products.reduce(
      (sum, p) => sum + (Number(p.stok) || 0),
      0,
    );
    const modalMengendap = products.reduce(
      (sum, p) => sum + (Number(p.harga_beli) || 0) * (Number(p.stok) || 0),
      0,
    );

    const unitTerjual = filteredTransactions.reduce(
      (sum, t) => sum + (Number(t.jumlah) || 0),
      0,
    );
    const labaBersih = filteredTransactions.reduce(
      (sum, t) => sum + (Number(t.laba) || 0),
      0,
    );
    const omzetTotal = filteredTransactions.reduce(
      (sum, t) => sum + (Number(t.total_harga) || 0),
      0,
    );

    return {
      totalJenis,
      totalStokGudang,
      modalMengendap,
      unitTerjual,
      labaBersih,
      omzetTotal,
    };
  }, [products, filteredTransactions]);

  // --- DATA GRAFIK BAR (Diperbarui dengan Pengisian Tanggal Kosong) ---
  const barChartData = useMemo(() => {
    if (!startDate || !endDate) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const selisihHari = (end - start) / (1000 * 60 * 60 * 24);
    const isBulanan = selisihHari > 31;

    const grouped = {};

    // 1. BUAT SLOT KOSONG DULU (Agar bulan/hari yang Rp0 tetap muncul)
    if (isBulanan) {
      let currMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      while (currMonth <= endMonth) {
        const bulan = currMonth.toLocaleString("id-ID", { month: "short" });
        const tahun = currMonth.getFullYear();
        const key = `${tahun}-${String(currMonth.getMonth() + 1).padStart(2, "0")}`;
        grouped[key] = { label: `${bulan} ${tahun}`, omzet: 0 };
        currMonth.setMonth(currMonth.getMonth() + 1);
      }
    } else {
      let currDay = new Date(start.setHours(0, 0, 0, 0));
      const endDay = new Date(end.setHours(0, 0, 0, 0));
      while (currDay <= endDay) {
        const tgl = String(currDay.getDate()).padStart(2, "0");
        const bln = String(currDay.getMonth() + 1).padStart(2, "0");
        const key = `${currDay.getFullYear()}-${bln}-${tgl}`;
        grouped[key] = { label: `${tgl}/${bln}`, omzet: 0 };
        currDay.setDate(currDay.getDate() + 1);
      }
    }

    // 2. MASUKKAN DATA TRANSAKSI KE DALAM SLOT
    filteredTransactions.forEach((t) => {
      const dateObj = new Date(t.tanggal);
      let key = "";
      if (isBulanan) {
        key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
      } else {
        const tgl = String(dateObj.getDate()).padStart(2, "0");
        const bln = String(dateObj.getMonth() + 1).padStart(2, "0");
        key = `${dateObj.getFullYear()}-${bln}-${tgl}`;
      }

      if (grouped[key]) {
        grouped[key].omzet += Number(t.total_harga) || 0;
      }
    });

    // 3. URUTKAN DAN EXPORT KE GRAFIK
    const sortedKeys = Object.keys(grouped).sort();
    return sortedKeys.map((key) => ({
      date: key,
      label: grouped[key].label,
      omzet: grouped[key].omzet,
    }));
  }, [filteredTransactions, startDate, endDate]);

  const pieChartData = useMemo(() => {
    const kategori = {};
    products.forEach((p) => {
      const jenis = p.jenis_sparepart || "Lainnya";
      kategori[jenis] = (kategori[jenis] || 0) + 1;
    });

    return Object.entries(kategori).map(([label, value], index) => ({
      id: index,
      value,
      label,
    }));
  }, [products]);

  const stokKritis = products.filter((p) => (Number(p.stok) || 0) < 6);

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
    <div className="space-y-2 md:space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-gray-800 dark:text-fontDark"
            data-aos="zoom-in"
            data-aos-delay="400"
            data-aos-duration="800"
          >
            Analisis Penjualan
          </h1>
          <p
            className="text-sm text-gray-500 dark:text-gray-400"
            data-aos="zoom-in"
            data-aos-delay="400"
            data-aos-duration="800"
          >
            Pantau performa konter Anda secara real-time.
          </p>
        </div>

        <div className="relative z-20">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="flex items-center gap-2 bg-white dark:bg-darkMode border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 shadow-sm hover:border-blue-500 dark:hover:border-blue-200 transition-all text-sm font-bold text-gray-700 dark:text-fontDark w-full md:w-auto justify-center"
          >
            <Calendar
              size={18}
              className={
                isDateOpen
                  ? "text-blue-500"
                  : "text-gray-400 dark:text-gray-200"
              }
            />
            {periodeLabel}
          </button>

          {isDateOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-darkMode border border-gray-200 rounded-2xl shadow-xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-gray-800 dark:text-fontDark">
                    Pilih Rentang Waktu
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-fontDark uppercase tracking-wider mb-1.5">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-fontDark uppercase tracking-wider mb-1.5">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setIsDateOpen(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors mt-2"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
        <DashboardCard
          title="Laba Bersih"
          value={
            <AnimatedNumber
              targetValue={stats.labaBersih}
              formatter={formatRupiah}
            />
          }
          icon={<TrendingUp size={24} className="text-green-600" />}
          colorClass="bg-green-100"
          subtitle={`Periode: ${periodeLabel}`}
        />
        <DashboardCard
          title="Total Omzet"
          value={
            <AnimatedNumber
              targetValue={stats.omzetTotal}
              formatter={formatRupiah}
            />
          }
          icon={<DollarSign size={24} className="text-blue-600" />}
          colorClass="bg-blue-100"
          subtitle={`Periode: ${periodeLabel}`}
        />
        <DashboardCard
          title="Produk Terjual"
          value={
            <AnimatedNumber
              targetValue={stats.unitTerjual}
              formatter={(val) => `${val} Unit`}
            />
          }
          icon={<ShoppingCart size={24} className="text-orange-600" />}
          colorClass="bg-orange-100"
          subtitle={`Periode: ${periodeLabel}`}
        />
        {/* Baris Kedua (Modal, Stok, Jenis) */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"> */}
          <DashboardCard
            title="Nilai Aset Modal"
            value={
              <AnimatedNumber
                targetValue={stats.modalMengendap}
                formatter={formatRupiah}
              />
            }
            icon={<Briefcase size={24} className="text-slate-600" />}
            colorClass="bg-slate-100"
            subtitle="Modal yang masih dalam bentuk barang"
          />
          <DashboardCard
            title="Total Stok Barang"
            value={
              <AnimatedNumber
                targetValue={stats.totalStokGudang}
                formatter={(val) => `${val} Pcs`}
              />
            }
            icon={<Layers size={24} className="text-indigo-600" />}
            colorClass="bg-indigo-100"
            subtitle="Total semua unit di rak"
          />
          <DashboardCard
            title="Jenis Sparepart"
            value={
              <AnimatedNumber
                targetValue={stats.totalJenis}
                formatter={(val) => `${val} Macam`}
              />
            }
            icon={<Package size={24} className="text-purple-600" />}
            colorClass="bg-purple-100"
            subtitle="Variasi produk yang tersedia"
          />
       
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Grafik Batang */}
        <div className="lg:col-span-2 bg-white dark:bg-darkMode p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 flex flex-col w-full min-h-[350px]">
          <h3
            className="text-sm font-bold text-gray-500 dark:text-gray-100 uppercase tracking-wider mb-4"
            data-aos="zoom-in"
            data-aos-delay="400"
            data-aos-duration="800"
          >
            Grafik Omzet ({periodeLabel})
          </h3>
          <div
            className="flex-1 w-full bg-white dark:bg-cardDark rounded-xl overflow-hidden p-2"
            // data-aos="zoom-in"
            // data-aos-delay="100"
            // data-aos-duration="500"
          >
            {barChartData.length > 0 ? (
              <BarChart
                dataset={barChartData}
                xAxis={[{ scaleType: "band", dataKey: "label" }]}
                // 1. TAMBAHKAN yAxis INI UNTUK MENYINGKAT ANGKA (Misal: 2 Jt, 500 Rb)
                yAxis={[
                  {
                    valueFormatter: (value) => {
                      if (value === 0) return "0";
                      if (value >= 1000000) return `${value / 1000000} Jt`;
                      if (value >= 1000) return `${value / 1000} Rb`;
                      return value;
                    },
                  },
                ]}
                series={[
                  {
                    dataKey: "omzet",
                    label: "Omzet",
                    color: "#2563eb",
                    // valueFormatter ini tetap formatRupiah agar saat di-hover/disentuh kursor, nominal aslinya tetap muncul lengkap
                    valueFormatter: (value) => formatRupiah(value),
                  },
                ]}
                height={300}
                slotProps={{ legend: { hidden: true } }}
                // 2. PERKECIL MARGIN KIRI (left) MENJADI 45 AGAR MAKSIMAL MERAPAT
                margin={{ top: 20, bottom: 10, left: 10, right: 10 }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                Belum ada transaksi di periode ini.
              </div>
            )}
          </div>
        </div>

        {/* Grafik Lingkaran (Sudah ditambahkan Width & Height) */}
        <div className="bg-white dark:bg-darkMode p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 flex flex-col min-h-[350px]">
          <h3
            className="text-sm font-bold text-gray-500 dark:text-gray-100 uppercase tracking-wider mb-4"
            data-aos="zoom-in"
            data-aos-delay="400"
            data-aos-duration="800"
          >
            Komposisi Stok Gudang
          </h3>
          <div className="flex-1 w-full flex flex-col items-center justify-center bg-white dark:bg-cardDark rounded-xl p-2">
            {pieChartData.length > 0 ? (
              <>
                <div className="animate-pie-spin">
                  <PieChart
                    series={[
                      {
                        data: pieChartData,
                        innerRadius: 45,
                        outerRadius: 90,
                        paddingAngle: 2,
                        cornerRadius: 4,
                      },
                    ]}
                    width={250} // KUNCI AGAR GRAFIK MUNCUL
                    height={200}
                    slotProps={{ legend: { hidden: true } }}
                    margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {pieChartData.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md"
                    >
                      {item.label}: {item.value}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm font-medium">
                Belum ada produk.
              </div>
            )}
          </div>
        </div>
      </div>

      {stokKritis.length > 0 && (
        <div className="bg-red-50 dark:bg-darkMode border border-red-100 dark:border-borderDark p-4 md:p-6 rounded-2xl shadow-sm flex max-h-[52dvh] md:max-h-[420px] flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-3 text-red-700 dark:text-red-400 font-bold mb-4">
            <div className="flex min-w-0 items-center gap-2">
              <AlertTriangle size={20} className="shrink-0 animate-bounce" />
              <h2 className="truncate text-base md:text-lg">
                Peringatan: Segera Re-Stok!
              </h2>
            </div>
            <span className="shrink-0 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black text-white">
              {stokKritis.length} ITEM
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-red-100 bg-white dark:bg-cardDark dark:border-borderDark [-webkit-overflow-scrolling:touch]">
            <table className="w-full table-fixed text-left">
              <thead className="sticky top-0 z-10 bg-red-100 dark:bg-red-950/40 text-[10px] uppercase tracking-wider text-red-700 dark:text-red-300">
                <tr>
                  <th className="w-[62%] px-3 py-2 font-black md:w-[48%]">
                    Produk
                  </th>
                  <th className="hidden px-3 py-2 font-black sm:table-cell">
                    Jenis
                  </th>
                  <th className="w-[38%] px-3 py-2 text-right font-black md:w-[24%]">
                    Stok
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 dark:divide-borderDark">
                {stokKritis.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="text-sm transition-colors hover:bg-red-50 dark:hover:bg-darkMode"
                  >
                    <td className="px-3 py-3">
                      <div className="truncate font-bold text-gray-800 dark:text-fontDark">
                        {item.merk || "-"}
                      </div>
                      <div className="truncate text-[10px] font-medium uppercase tracking-tighter text-gray-500 dark:text-gray-200">
                        {item.model || "-"}
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-200 sm:table-cell">
                      <span className="block truncate">
                        {item.jenis_sparepart || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="inline-flex min-w-[64px] justify-center rounded-lg bg-red-600 px-2 py-1.5 text-[10px] font-black text-white">
                        SISA {item.stok}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

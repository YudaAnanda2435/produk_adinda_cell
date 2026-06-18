import { useMemo, useState, useEffect } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
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
import * as api from "../services/api";

let hasPlayedDashboardCountAnimation = false;

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);
};

// Komponen animasi angka
const AnimatedNumber = ({
  targetValue,
  formatter,
  duration = 2500,
  shouldAnimate = false,
}) => {
  const target = Number(targetValue) || 0;
  const renderStatic =
    !shouldAnimate ||
    window.matchMedia("(max-width: 767px)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [count, setCount] = useState(() => (renderStatic ? target : 0));

  useEffect(() => {
    if (renderStatic) return;

    let animationFrame = null;
    let startTimestamp = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;

      // Hitung persentase waktu yang berjalan (0 hingga 1)
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Rumus deselerasi (Ease-Out) agar putaran angka melambat saat mendekati target
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [duration, renderStatic, target]);

  const value = renderStatic ? target : count;
  return <>{formatter ? formatter(value) : value}</>;
};

const DashboardCard = ({ title, value, icon, colorClass, subtitle }) => (
  <div className="bg-white font-default dark:bg-darkMode p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-darkMode flex items-center space-x-4 transition-all hover:shadow-md">
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

const Dashboard = ({ products = [], dataVersion = 0 }) => {
  const hariIni = new Date().toISOString().split("T")[0];
  const [shouldAnimateCounts] = useState(() => {
    if (hasPlayedDashboardCountAnimation) return false;
    hasPlayedDashboardCountAnimation = true;
    return true;
  });

  // --- PERUBAHAN: Baca memori browser untuk state awal ---
  const [startDate, setStartDate] = useState(() => {
    return localStorage.getItem("dashboardStartDate") || hariIni;
  });
  const [endDate, setEndDate] = useState(() => {
    return localStorage.getItem("dashboardEndDate") || hariIni;
  });
  const [summary, setSummary] = useState(
    () =>
      api.getCachedDashboardSummary({ startDate, endDate }) || {
        unitTerjual: 0,
        labaBersih: 0,
        omzetTotal: 0,
        barChartData: [],
      },
  );
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [shouldRenderCharts, setShouldRenderCharts] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  useEffect(() => {
    localStorage.setItem("dashboardStartDate", startDate);
    localStorage.setItem("dashboardEndDate", endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    let isActive = true;

    const loadSummary = async () => {
      const cachedSummary = api.getCachedDashboardSummary({
        startDate,
        endDate,
      });

      if (cachedSummary) {
        setSummary(cachedSummary);
        setSummaryLoading(false);
      } else {
        setSummaryLoading(true);
      }

      const data = await api.getDashboardSummary({
        startDate,
        endDate,
        refreshKey: dataVersion,
      });
      if (isActive) {
        setSummary(data);
        setSummaryLoading(false);
      }
    };

    loadSummary();
    return () => {
      isActive = false;
    };
  }, [dataVersion, startDate, endDate]);

  useEffect(() => {
    const schedule =
      window.requestIdleCallback ||
      ((callback) => window.setTimeout(callback, 250));
    const cancel =
      window.cancelIdleCallback || ((id) => window.clearTimeout(id));

    const taskId = schedule(() => setShouldRenderCharts(true));
    return () => cancel(taskId);
  }, []);

  const productStats = useMemo(() => {
    const totalJenis = products.length;
    const totalStokGudang = products.reduce(
      (sum, p) => sum + (Number(p.stok) || 0),
      0,
    );
    const modalMengendap = products.reduce(
      (sum, p) => sum + (Number(p.harga_beli) || 0) * (Number(p.stok) || 0),
      0,
    );

    return {
      totalJenis,
      totalStokGudang,
      modalMengendap,
    };
  }, [products]);

  const stats = {
    ...productStats,
    unitTerjual: summary.unitTerjual,
    labaBersih: summary.labaBersih,
    omzetTotal: summary.omzetTotal,
  };

  const barChartData = summary.barChartData || [];

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
            // data-aos="zoom-in"
            // data-aos-delay="400"
            // data-aos-duration="800"
          >
            Analisis Penjualan
          </h1>
          <p
            className="text-sm text-gray-500 dark:text-gray-400"
            // data-aos="zoom-in"
            // data-aos-delay="400"
            // data-aos-duration="800"
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
            <>
              <button
                type="button"
                aria-label="Tutup filter tanggal"
                className="fixed inset-0 z-40 cursor-default bg-transparent"
                onClick={() => setIsDateOpen(false)}
              />
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
            </>
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
              shouldAnimate={shouldAnimateCounts}
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
              shouldAnimate={shouldAnimateCounts}
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
              shouldAnimate={shouldAnimateCounts}
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
                shouldAnimate={shouldAnimateCounts}
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
                shouldAnimate={shouldAnimateCounts}
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
                shouldAnimate={shouldAnimateCounts}
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
            // data-aos="zoom-in"
            // data-aos-delay="400"
            // data-aos-duration="800"
          >
            Grafik Omzet ({periodeLabel})
          </h3>
          <div
            className="flex-1 w-full bg-white dark:bg-cardDark rounded-xl overflow-hidden p-2"
            // data-aos="zoom-in"
            // data-aos-delay="100"
            // data-aos-duration="500"
          >
            {summaryLoading ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                Memuat ringkasan omzet...
              </div>
            ) : !shouldRenderCharts ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                Menyiapkan grafik...
              </div>
            ) : barChartData.length > 0 ? (
              <LineChart
                height={300}
                xAxis={[
                  {
                    scaleType: "band",
                    data: barChartData.map((d) => d.label),
                    tickLabelStyle: {
                      fontSize: 10,
                      fill: "currentColor",
                    },
                  },
                ]}
                yAxis={[
                  {
                    tickLabelStyle: {
                      fontSize: 10,
                      fill: "currentColor",
                    },
                    valueFormatter: (v) => {
                      if (v >= 1000000) return `${(v / 1000000).toFixed(1)} Jt`;
                      if (v >= 1000) return `${(v / 1000).toFixed(0)} Rb`;
                      return String(v);
                    },
                  },
                ]}
                grid={{ vertical: false, horizontal: true }}
                series={[
                  {
                    data: barChartData.map((d) => d.omzet),
                    label: "Omzet",
                    color: "#2563eb",
                    showMark: false,
                    valueFormatter: (v) => formatRupiah(v),
                  },
                ]}
                sx={{
                  "& .MuiChartsAxis-tickLabel": {
                    fill: "#6b7280",
                  },
                  "& .MuiChartsAxis-line": {
                    stroke: "#d1d5db",
                  },
                  "& .MuiChartsGrid-line": {
                    stroke: "#e5e7eb",
                  },
                  ".dark &": {
                    "& .MuiChartsAxis-tickLabel": {
                      fill: "#d1d5db",
                    },
                    "& .MuiChartsAxis-line": {
                      stroke: "#4b5563",
                    },
                    "& .MuiChartsGrid-line": {
                      stroke: "#374151",
                    },
                  },
                }}
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
            // data-aos="zoom-in"
            // data-aos-delay="400"
            // data-aos-duration="800"
          >
            Komposisi Stok Gudang
          </h3>
          <div className="flex-1 w-full flex flex-col items-center justify-center bg-white dark:bg-cardDark rounded-xl p-2">
            {!shouldRenderCharts ? (
              <div className="text-gray-400 text-sm font-medium">
                Menyiapkan grafik...
              </div>
            ) : pieChartData.length > 0 ? (
              <div className="flex flex-col items-center gap-3">
                <PieChart
                  series={[
                    {
                      data: pieChartData,
                      highlightScope: { fade: "global", highlight: "item" },
                      faded: {
                        innerRadius: 30,
                        additionalRadius: -30,
                        color: "gray",
                      },
                      innerRadius: 30,
                      outerRadius: 80,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      valueFormatter: (item) => `${item.value} Jenis`,
                    },
                  ]}
                  height={220}
                  width={220}
                  sx={{
                    "& .MuiPieArcLabel-root": {
                      fontSize: 10,
                      fontWeight: 700,
                    },
                  }}
                />
                <div className="flex flex-wrap justify-center gap-1.5 max-w-[200px]">
                  {pieChartData.slice(0, 6).map((item, i) => (
                    <div
                      key={item.id}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-600 dark:bg-slate-800 dark:text-gray-300"
                    >
                      {item.label}: {item.value}
                    </div>
                  ))}
                </div>
              </div>
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

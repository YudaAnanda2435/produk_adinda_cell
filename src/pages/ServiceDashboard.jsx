import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Calendar,
  DollarSign,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import { SimpleBarChart } from "../components/LightweightCharts";
import {
  filterServiceByDate,
  formatDateLabel,
  formatRupiah,
  getServiceLaba,
  getServiceDateRange,
  getServiceTotalBayar,
  getServiceStats,
} from "../utils/service";

const buildChartData = (services) => {
  const grouped = {};

  services.forEach((service) => {
    const date = new Date(service.tanggal);
    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().split("T")[0];
    grouped[key] = grouped[key] || {
      date: key,
      label: formatDateLabel(key).slice(0, 5),
      totalBayar: 0,
      laba: 0,
    };
    grouped[key].totalBayar += getServiceTotalBayar(service);
    grouped[key].laba += getServiceLaba(service);
  });

  return Object.keys(grouped)
    .sort()
    .map((key) => grouped[key]);
};

const DashboardCard = ({ title, value, icon, colorClass, subtitle }) => (
  <div className="bg-white dark:bg-darkMode p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-borderDark flex items-center space-x-4 transition-all hover:shadow-md">
    <div className={`p-4 rounded-xl ${colorClass} shadow-sm`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-100 font-bold">
        {title}
      </p>
      <h3 className="text-[16px] font-bold text-gray-800 dark:text-gray-100 truncate">
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

export default function ServiceDashboard({
  serviceTransactions = [],
  fetchServiceTransactions,
  refreshKey,
  isLoading,
}) {
  const defaultRange = getServiceDateRange();
  const [startDate, setStartDate] = useState(
    () => localStorage.getItem("serviceDashboardStartDate") || defaultRange.end,
  );
  const [endDate, setEndDate] = useState(
    () => localStorage.getItem("serviceDashboardEndDate") || defaultRange.end,
  );
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [shouldRenderCharts, setShouldRenderCharts] = useState(false);

  useEffect(() => {
    localStorage.setItem("serviceDashboardStartDate", startDate);
    localStorage.setItem("serviceDashboardEndDate", endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchServiceTransactions?.({ startDate, endDate, refreshKey });
  }, [endDate, fetchServiceTransactions, refreshKey, startDate]);

  useEffect(() => {
    const schedule =
      window.requestIdleCallback || ((callback) => window.setTimeout(callback, 250));
    const cancel =
      window.cancelIdleCallback || ((id) => window.clearTimeout(id));

    const taskId = schedule(() => setShouldRenderCharts(true));
    return () => cancel(taskId);
  }, []);

  const filteredServices = useMemo(
    () => filterServiceByDate(serviceTransactions, startDate, endDate),
    [endDate, serviceTransactions, startDate],
  );

  const stats = useMemo(
    () => getServiceStats(filteredServices),
    [filteredServices],
  );
  const chartData = useMemo(
    () => buildChartData(filteredServices),
    [filteredServices],
  );
  const recentServices = useMemo(
    () => [...filteredServices].reverse().slice(0, 6),
    [filteredServices],
  );

  const periodeLabel =
    startDate === endDate
      ? formatDateLabel(startDate)
      : `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-fontDark flex items-center gap-2">
            <Wrench className="text-blue-600" /> Dashboard Service
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pantau total bayar, sparepart/komponen, dan laba jasa service.
          </p>
        </div>

        <div className="relative z-20">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="flex items-center gap-2 bg-white dark:bg-darkMode border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 shadow-sm hover:border-blue-500 dark:hover:border-blue-200 transition-all text-sm font-bold text-gray-700 dark:text-fontDark w-full md:w-auto justify-center"
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
                    Pilih Rentang Waktu
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 dark:text-fontDark uppercase tracking-wider mb-1.5">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
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
                        onChange={(event) => setEndDate(event.target.value)}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <DashboardCard
          title="Total Laba Service"
          value={formatRupiah(stats.totalLaba)}
          icon={<TrendingUp size={24} className="text-green-600" />}
          colorClass="bg-green-100"
          subtitle={`Periode: ${periodeLabel}`}
        />
        <DashboardCard
          title="Total Bayar"
          value={formatRupiah(stats.totalBayar)}
          icon={<DollarSign size={24} className="text-blue-600" />}
          colorClass="bg-blue-100"
          subtitle="Sparepart ditambah jasa"
        />
        <DashboardCard
          title="Sparepart / Komponen"
          value={formatRupiah(stats.totalSparepart)}
          icon={<Wallet size={24} className="text-orange-600" />}
          colorClass="bg-orange-100"
          subtitle="Komponen yang diganti"
        />
        <DashboardCard
          title="Jumlah Service"
          value={`${stats.totalTransaksi} Transaksi`}
          icon={<BriefcaseBusiness size={24} className="text-purple-600" />}
          colorClass="bg-purple-100"
          subtitle="Pekerjaan selesai tercatat"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-darkMode p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-borderDark flex flex-col min-h-[350px]">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-100 uppercase tracking-wider mb-4">
            Grafik Service ({periodeLabel})
          </h3>
          <div className="flex-1 bg-white dark:bg-cardDark rounded-xl overflow-hidden p-2">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                Memuat laporan service...
              </div>
            ) : !shouldRenderCharts ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                Menyiapkan grafik...
              </div>
            ) : chartData.length > 0 ? (
              <SimpleBarChart
                data={chartData}
                series={[
                  {
                    dataKey: "totalBayar",
                    label: "Total Bayar",
                    color: "#2563eb",
                    valueFormatter: formatRupiah,
                  },
                  {
                    dataKey: "laba",
                    label: "Laba",
                    color: "#16a34a",
                    valueFormatter: formatRupiah,
                  },
                ]}
                emptyMessage="Belum ada transaksi service pada periode ini."
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                Belum ada transaksi service pada periode ini.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-darkMode p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-borderDark flex max-h-[52dvh] min-h-[350px] flex-col overflow-hidden md:max-h-[420px]">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-100 uppercase tracking-wider mb-4">
            Service Terbaru
          </h3>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
            {recentServices.length > 0 ? (
              <div className="space-y-3">
                {recentServices.map((service, index) => (
                  <div
                    key={service.id || index}
                    className="rounded-xl border border-gray-100 dark:border-borderDark p-3"
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-sm text-gray-800 dark:text-fontDark truncate">
                          {service.pelanggan || "-"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                          {service.perangkat || "-"}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs font-black text-green-600">
                        {formatRupiah(getServiceLaba(service))}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-300 line-clamp-2">
                      {service.keluhan || service.catatan || "-"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-sm font-medium text-gray-400">
                Belum ada service terbaru.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

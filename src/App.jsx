import { Suspense, lazy, useCallback, useRef, useState, useEffect } from "react";
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Database,
  Receipt,
  LogOut,
  Menu,
  X,
  MessageCircle,
  ChevronDown,
  BarChart3,
  ClipboardList,
  Wrench,
  Moon, // Import icon Moon
  Sun, // Import icon Sun
} from "lucide-react";
import { DashboardSkeleton, TableSkeleton } from "./components/Skeleton";
import ConfirmModal from "./components/ConfirmModal";
import Login from "./pages/Login";
import * as api from "./services/api";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Kasir = lazy(() => import("./pages/Kasir"));
const Riwayat = lazy(() => import("./pages/Riwayat"));
const ServiceDashboard = lazy(() => import("./pages/ServiceDashboard"));
const ServiceTransaction = lazy(() => import("./pages/ServiceTransaction"));
const ServiceHistory = lazy(() => import("./pages/ServiceHistory"));
const AiAssistant = lazy(() => import("./components/AiAssistant"));

const isSameTransaction = (a, b) =>
  String(a.nama_produk || "") === String(b.nama_produk || "") &&
  Number(a.jumlah || 0) === Number(b.jumlah || 0) &&
  Number(a.total_harga || 0) === Number(b.total_harga || 0) &&
  Number(a.laba || 0) === Number(b.laba || 0) &&
  String(a.metode_pembayaran || "") === String(b.metode_pembayaran || "");

const mergeLocalTransactions = (serverTransactions, localTransactions) => {
  const serverData = serverTransactions || [];
  const pendingLocal = localTransactions.filter(
    (local) => !serverData.some((server) => isSameTransaction(server, local)),
  );

  return [...pendingLocal, ...serverData];
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true",
  );
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem("userRole") || "",
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem("userName") || "",
  );

  const [activeTab, setActiveTab] = useState(() =>
    localStorage.getItem("userRole") === "admin" ? "dashboard" : "kasir",
  );

  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [, setLocalTransactions] = useState([]);
  const localTransactionsRef = useRef([]);
  const [transactionsRefreshKey, setTransactionsRefreshKey] = useState(0);
  const [serviceTransactions, setServiceTransactions] = useState([]);
  const [serviceRefreshKey, setServiceRefreshKey] = useState(0);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [isServiceLoading, setIsServiceLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServiceMenuOpen, setIsServiceMenuOpen] = useState(false);
  const [shouldLoadAiAssistant, setShouldLoadAiAssistant] = useState(false);

  // --- TAMBAHAN: STATE UNTUK DARK MODE ---
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  // --- TAMBAHAN: EFEK UNTUK MENERAPKAN CLASS KE HTML ---
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const fetchProducts = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsProductsLoading(true);
    try {
      const prodData = await api.getProducts();
      setProducts(prodData ? [...prodData].reverse() : []);
    } catch (error) {
      console.error("Gagal sinkronisasi data produk:", error);
    } finally {
      if (!isSilent) setIsProductsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async ({
    isSilent = false,
    startDate,
    endDate,
    refreshKey,
  } = {}) => {
    if (!isSilent) setIsTransactionsLoading(true);
    try {
      const transData = await api.getTransactions({
        startDate,
        endDate,
        refreshKey,
      });
      const serverTransactions = transData || [];
      setTransactions(
        mergeLocalTransactions(
          serverTransactions,
          localTransactionsRef.current,
        ),
      );
      setLocalTransactions((currentLocalTransactions) =>
        {
          const nextLocalTransactions = currentLocalTransactions.filter(
            (local) =>
              !serverTransactions.some((server) =>
                isSameTransaction(server, local),
              ),
          );
          localTransactionsRef.current = nextLocalTransactions;
          return nextLocalTransactions;
        },
      );
    } catch (error) {
      console.error("Gagal sinkronisasi data transaksi:", error);
    } finally {
      if (!isSilent) setIsTransactionsLoading(false);
    }
  }, []);

  const handleTransactionSaved = useCallback((transaction) => {
    const now = new Date();
    const localTransaction = {
      id: `LOCAL-${now.getTime()}`,
      tanggal: now.toISOString(),
      ...transaction,
    };

    setLocalTransactions((currentTransactions) => {
      const nextLocalTransactions = [localTransaction, ...currentTransactions];
      localTransactionsRef.current = nextLocalTransactions;
      return nextLocalTransactions;
    });
    setTransactions((currentTransactions) => [
      localTransaction,
      ...currentTransactions.filter(
        (item) => !isSameTransaction(item, localTransaction),
      ),
    ]);
    setTransactionsRefreshKey(now.getTime());
  }, []);

  const handleSetTransactions = useCallback((nextTransactions) => {
    if (typeof nextTransactions === "function") {
      setTransactions(nextTransactions);
      return;
    }

    setTransactions(nextTransactions);
    setLocalTransactions((currentLocalTransactions) => {
      const nextLocalTransactions = currentLocalTransactions.filter((local) =>
        nextTransactions.some((item) => item.id === local.id),
      );
      localTransactionsRef.current = nextLocalTransactions;
      return nextLocalTransactions;
    });
  }, []);

  const fetchServiceTransactions = useCallback(async ({
    isSilent = false,
    startDate,
    endDate,
    refreshKey,
  } = {}) => {
    if (!isSilent) setIsServiceLoading(true);
    try {
      const serviceData = await api.getServiceTransactions({
        startDate,
        endDate,
        refreshKey,
      });
      setServiceTransactions(serviceData || []);
    } catch (error) {
      console.error("Gagal sinkronisasi data service:", error);
    } finally {
      if (!isSilent) setIsServiceLoading(false);
    }
  }, []);

  const handleServiceSaved = useCallback((serviceTransaction) => {
    const now = new Date();
    const localService = {
      id: `LOCAL-SERVICE-${now.getTime()}`,
      tanggal: now.toISOString(),
      ...serviceTransaction,
    };

    setServiceTransactions((currentTransactions) => [
      localService,
      ...currentTransactions,
    ]);
    setServiceRefreshKey(now.getTime());
  }, []);

  const handleSetServiceTransactions = useCallback((nextTransactions) => {
    setServiceTransactions(nextTransactions);
  }, []);

  const handleClearTransactions = useCallback(() => {
    setTransactions([]);
    localTransactionsRef.current = [];
    setLocalTransactions([]);
  }, []);

  const handleClearServiceTransactions = useCallback(() => {
    setServiceTransactions([]);
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchProducts();
  }, [fetchProducts, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const canAnimate =
      window.matchMedia("(min-width: 768px)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canAnimate) return;

    Promise.all([import("aos"), import("aos/dist/aos.css")]).then(([AOS]) => {
      AOS.default.init({
        duration: 700,
        once: true,
        offset: 50,
      });
    });
  }, [isLoggedIn]);

  const tabFallback =
    activeTab === "dashboard" ? <DashboardSkeleton /> : <TableSkeleton />;

  const handleLogin = (role, name) => {
    setUserRole(role);
    setUserName(name);
    setIsLoggedIn(true);

    const initialTab = role === "admin" ? "dashboard" : "kasir";
    setActiveTab(initialTab);

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", role);
    localStorage.setItem("userName", name);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole("");
    setUserName("");
    setProducts([]);
    handleClearTransactions();
    handleClearServiceTransactions();

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
  };

  const handleNavigation = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const serviceMenuIsActive = activeTab.startsWith("service-");

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLogin} />;
  }


  return (
    // TAMBAHAN: dark:bg-slate-950 dark:text-gray-100 pada container utama
    <div className="h-screen [height:100dvh] overflow-hidden bg-gray-50 dark:bg-slate-950 flex flex-col md:flex-row font-helvetica text-gray-800 dark:text-gray-100 transition-colors duration-300">
      {/* Header Mobile */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 dark:bg-black text-white p-4 pr-20 shadow-md z-20 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <Package className="text-blue-400" size={24} />
          <h1 className="text-lg font-bold tracking-wider">Adinda Cell</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Tombol Toggle Tema Mobile */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1 text-slate-300 hover:text-yellow-400 transition-colors"
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed right-4 top-4 z-[10000000] p-1 text-slate-300 hover:text-white transition-colors md:hidden"
        aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
      >
        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[9999998] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigasi */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-[9999999] md:z-10 w-64 bg-slate-900 dark:bg-black text-white shadow-2xl flex flex-col 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-xl  border-transparent dark:border-slate-800
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-6 hidden md:flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-wider flex items-center">
              <Package className="mr-3 text-blue-400" /> Adinda Cell
            </h2>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1 font-semibold">
              Halo, {userName} ({userRole})
            </p>
          </div>
          {/* Tombol Toggle Tema Desktop */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-yellow-400 transition-colors"
            title={isDarkMode ? "Ganti Tema Terang" : "Ganti Tema Gelap"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Profil pengguna mobile */}
        <div className="p-6 md:hidden border-b border-slate-800 mb-2">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            Masuk Sebagai:
          </p>
          <p className="text-lg font-bold text-white mt-1">{userName}</p>
          <p className="text-sm text-blue-400 capitalize">{userRole}</p>
        </div>

        <nav className="flex-1 pl-4 space-y-2 md:space-y-4 mt-4 md:mt-0">
          {userRole === "admin" && (
            <button
              onClick={() => handleNavigation("dashboard")}
              className={`group relative w-full flex items-center cursor-pointer px-4 py-3 transition-colors duration-300 ${
                activeTab === "dashboard"
                  ? "text-darkMode dark:text-fontDark"
                  : "text-slate-400"
              }`}
            >
              {/* --- EFEK HOVER --- */}
              {activeTab !== "dashboard" && (
                <div className="absolute inset-y-1 left-2 right-6 rounded-full opacity-0 group-hover:opacity-100 bg-slate-800/20 dark:bg-slate-700/40 transition-opacity duration-300" />
              )}

              {/* --- EFEK AKTIF --- */}
              {activeTab === "dashboard" && (
                <div className="absolute inset-0 bg-slate-50 dark:bg-dashboardDark rounded-l-full nav-active-curve transition-all duration-200" />
              )}

              {/* PERUBAHAN: Font Size Dinamis dengan Transisi */}
              <span
                className={`relative z-10 flex items-center transition-all duration-300 ${
                  activeTab === "dashboard" ? "text-[18px]" : "text-[14px]"
                }`}
              >
                <LayoutDashboard size={20} className="mr-3" /> Dashboard
              </span>
            </button>
          )}

          <button
            onClick={() => handleNavigation("kasir")}
            className={`group relative w-full flex items-center cursor-pointer px-4 py-3 transition-colors duration-300 ${
              activeTab === "kasir"
                ? "text-darkMode dark:text-fontDark"
                : "text-slate-400"
            }`}
          >
            {activeTab !== "kasir" && (
              <div className="absolute inset-y-1 left-2 right-6 rounded-full opacity-0 group-hover:opacity-100 bg-slate-800/20 dark:bg-slate-700/40 transition-opacity duration-300" />
            )}

            {activeTab === "kasir" && (
              <div className="absolute inset-0 bg-slate-50 dark:bg-dashboardDark rounded-l-full nav-active-curve transition-all duration-200" />
            )}

            {/* PERUBAHAN: Font Size Dinamis dengan Transisi */}
            <span
              className={`relative z-10 flex items-center transition-all duration-300 ${
                activeTab === "kasir" ? "text-[18px]" : "text-[14px]"
              }`}
            >
              <ShoppingCart size={20} className="mr-3" /> Kasir Penjualan
            </span>
          </button>

          {userRole === "admin" && (
            <>
              <button
                onClick={() => handleNavigation("riwayat")}
                className={`group relative w-full flex items-center cursor-pointer px-4 py-3 transition-colors duration-300 ${
                  activeTab === "riwayat"
                    ? "text-darkMode dark:text-fontDark"
                    : "text-slate-400"
                }`}
              >
                {activeTab !== "riwayat" && (
                  <div className="absolute inset-y-1 left-2 right-6 rounded-full opacity-0 group-hover:opacity-100 bg-slate-800/20 dark:bg-slate-700/40 transition-opacity duration-300" />
                )}

                {activeTab === "riwayat" && (
                  <div className="absolute inset-0 bg-slate-50 dark:bg-dashboardDark rounded-l-full nav-active-curve transition-all duration-200" />
                )}

                {/* PERUBAHAN: Font Size Dinamis dengan Transisi */}
                <span
                  className={`relative z-10 flex items-center transition-all duration-300 ${
                    activeTab === "riwayat" ? "text-[18px]" : "text-[14px]"
                  }`}
                >
                  <Receipt size={20} className="mr-3" /> Riwayat Transaksi
                </span>
              </button>

              <button
                onClick={() => handleNavigation("products")}
                className={`group relative w-full flex items-center cursor-pointer px-4 py-3 transition-colors duration-300 ${
                  activeTab === "products"
                    ? "text-darkMode dark:text-fontDark"
                    : "text-slate-400"
                }`}
              >
                {activeTab !== "products" && (
                  <div className="absolute inset-y-1 left-2 right-6 rounded-full bg-slate-800/20 dark:bg-black  dark:group-hover:bg-dashboardDark transition-colors duration-300" />
                )}

                {activeTab === "products" && (
                  <div className="absolute inset-0 bg-slate-50 dark:bg-dashboardDark rounded-l-full nav-active-curve transition-all duration-200" />
                )}

                {/* PERUBAHAN: Font Size Dinamis dengan Transisi */}
                <span
                  className={`relative z-10 flex items-center transition-all duration-300 ${
                    activeTab === "products" ? "text-[18px]" : "text-[14px]"
                  }`}
                >
                  <Database size={20} className="mr-3" /> Data Stok Produk
                </span>
              </button>
              <div>
                <button
                  onClick={() => setIsServiceMenuOpen((isOpen) => !isOpen)}
                  className={`group relative w-full flex items-center justify-between cursor-pointer px-4 py-3 transition-colors duration-300 ${
                    serviceMenuIsActive
                      ? "text-darkMode dark:text-fontDark"
                      : "text-slate-400"
                  }`}
                >
                  {!serviceMenuIsActive && (
                    <div className="absolute inset-y-1 left-2 right-6 rounded-full opacity-0 group-hover:opacity-100 bg-slate-800/20 dark:bg-slate-700/40 transition-opacity duration-300" />
                  )}

                  {serviceMenuIsActive && (
                    <div className="absolute inset-0 bg-slate-50 dark:bg-dashboardDark rounded-l-full nav-active-curve transition-all duration-200" />
                  )}

                  <span
                    className={`relative z-10 flex items-center transition-all duration-300 ${
                      serviceMenuIsActive ? "text-[18px]" : "text-[14px]"
                    }`}
                  >
                    <Wrench size={20} className="mr-3" /> Service
                  </span>
                  <ChevronDown
                    size={18}
                    className={`relative z-10 mr-5 transition-transform duration-300 ${
                      isServiceMenuOpen || serviceMenuIsActive
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {(isServiceMenuOpen || serviceMenuIsActive) && (
                  <div className="mr-4 ml-8 mt-4 space-y-1">
                    {userRole === "admin" && (
                      <button
                        onClick={() => handleNavigation("service-dashboard")}
                        className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                          activeTab === "service-dashboard"
                            ? "bg-blue-500/15 text-blue-300"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                        }`}
                      >
                        <BarChart3 size={16} /> Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => handleNavigation("service-transaction")}
                      className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                        activeTab === "service-transaction"
                          ? "bg-blue-500/15 text-blue-300"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <Wrench size={16} /> Transaksi
                    </button>
                    {userRole === "admin" && (
                      <button
                        onClick={() => handleNavigation("service-history")}
                        className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                          activeTab === "service-history"
                            ? "bg-blue-500/15 text-blue-300"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                        }`}
                      >
                        <ClipboardList size={16} /> Riwayat
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all mb-4"
          >
            <LogOut size={18} className="mr-2" /> Keluar
          </button>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div
                className={`h-2 w-2 rounded-full ${api.API_URL ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
              ></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-300 uppercase">
                  Status Server
                </span>
                <span className="text-[9px] text-slate-500 truncate w-32">
                  {api.API_URL
                    ? "Terhubung ke Google Cloud"
                    : "Koneksi Terputus"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Konten Utama - Tambahkan dark:bg-slate-900 */}
      <main className="flex-1 min-h-0 z-999 p-4 pb-24 md:p-6 overflow-y-auto overscroll-contain bg-gray-50 dark:bg-dashboardDark flex flex-col relative z-10 transition-colors duration-300">
        <Suspense fallback={tabFallback}>
          <>
            {activeTab === "kasir" && (
              <Kasir
                products={products}
                fetchProducts={fetchProducts}
                onTransactionSaved={handleTransactionSaved}
                isLoading={isProductsLoading}
              />
            )}
            {activeTab === "service-dashboard" && userRole === "admin" && (
              <ServiceDashboard
                serviceTransactions={serviceTransactions}
                fetchServiceTransactions={fetchServiceTransactions}
                refreshKey={serviceRefreshKey}
                isLoading={isServiceLoading}
              />
            )}
            {activeTab === "service-transaction" && (
              <ServiceTransaction
                onServiceSaved={handleServiceSaved}
                fetchServiceTransactions={fetchServiceTransactions}
              />
            )}
            {activeTab === "service-history" && userRole === "admin" && (
              <ServiceHistory
                serviceTransactions={serviceTransactions}
                setServiceTransactions={handleSetServiceTransactions}
                fetchServiceTransactions={fetchServiceTransactions}
                refreshKey={serviceRefreshKey}
                isLoading={isServiceLoading}
              />
            )}
            {activeTab === "dashboard" &&
              userRole === "admin" &&
              (isProductsLoading ? (
                <DashboardSkeleton />
              ) : (
                <Dashboard
                  products={products}
                  dataVersion={transactionsRefreshKey}
                />
              ))}
            {activeTab === "riwayat" && userRole === "admin" && (
              <Riwayat
                transactions={transactions}
                setTransactions={handleSetTransactions}
                fetchProducts={fetchProducts}
                fetchTransactions={fetchTransactions}
                refreshKey={transactionsRefreshKey}
                isLoading={isTransactionsLoading}
              />
            )}
            {activeTab === "products" &&
              userRole === "admin" &&
              (isProductsLoading ? (
                <TableSkeleton />
              ) : (
                <Products
                  products={products}
                  fetchProducts={fetchProducts}
                  setProducts={setProducts}
                />
              ))}
          </>
        </Suspense>
      </main>

      {shouldLoadAiAssistant ? (
        <Suspense fallback={null}>
          <AiAssistant initialOpen />
        </Suspense>
      ) : (
        <button
          onClick={() => setShouldLoadAiAssistant(true)}
          className="fixed bottom-6 right-6 z-9999 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform duration-300 hover:scale-110 active:scale-90"
          title="Buka Asisten Cell AI"
        >
          <MessageCircle size={28} />
        </button>
      )}

      <ConfirmModal
        open={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          handleLogout();
        }}
        title="Keluar dari Aplikasi?"
        message="Anda harus masuk kembali menggunakan username dan password untuk mengakses sistem kasir."
        confirmText="Ya, Keluar"
        color="danger"
      />
    </div>
  );
}

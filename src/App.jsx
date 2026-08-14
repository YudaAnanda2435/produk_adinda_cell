import { Suspense, lazy, useCallback, useRef, useState, useEffect } from "react";
import { DashboardSkeleton, TableSkeleton } from "./components/Skeleton";
import ConfirmModal from "./components/ConfirmModal";
import Sidebar from "./components/Sidebar";
import * as api from "./services/api";

const loadLogin = () => import("./pages/Login");
const loadDashboard = () => import("./pages/Dashboard");
const loadProducts = () => import("./pages/Products");
const loadKasir = () => import("./pages/Kasir");
const loadRiwayat = () => import("./pages/Riwayat");
const loadServiceDashboard = () => import("./pages/ServiceDashboard");
const loadServiceTransaction = () => import("./pages/ServiceTransaction");
const loadServiceHistory = () => import("./pages/ServiceHistory");

const Login = lazy(loadLogin);
const Dashboard = lazy(loadDashboard);
const Products = lazy(loadProducts);
const Kasir = lazy(loadKasir);
const Riwayat = lazy(loadRiwayat);
const ServiceDashboard = lazy(loadServiceDashboard);
const ServiceTransaction = lazy(loadServiceTransaction);
const ServiceHistory = lazy(loadServiceHistory);

const pageLoaders = {
  dashboard: loadDashboard,
  products: loadProducts,
  kasir: loadKasir,
  riwayat: loadRiwayat,
  "service-dashboard": loadServiceDashboard,
  "service-transaction": loadServiceTransaction,
  "service-history": loadServiceHistory,
};

const preloadPage = (tab) => {
  pageLoaders[tab]?.();
};

const runWhenIdle = (callback) => {
  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(callback, { timeout: 1500 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(callback, 500);
  return () => window.clearTimeout(timeoutId);
};

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

const resetDocumentScroll = () => {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

const getInitialTab = () =>
  localStorage.getItem("userRole") === "admin" ? "dashboard" : "kasir";

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

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [renderedTab, setRenderedTab] = useState(getInitialTab);

  const [products, setProducts] = useState(() => api.getCachedProducts());
  const [transactions, setTransactions] = useState([]);
  const [, setLocalTransactions] = useState([]);
  const localTransactionsRef = useRef([]);
  const navigationFrameRef = useRef(null);
  const [transactionsRefreshKey, setTransactionsRefreshKey] = useState(0);
  const [serviceTransactions, setServiceTransactions] = useState([]);
  const [serviceRefreshKey, setServiceRefreshKey] = useState(0);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [isServiceLoading, setIsServiceLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServiceMenuOpen, setIsServiceMenuOpen] = useState(false);

  // Efek untuk memastikan tema default adalah terang (putih)
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

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
    if (isLoggedIn) fetchProducts(userRole === "admin");
  }, [fetchProducts, isLoggedIn, userRole]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    return runWhenIdle(() => {
      loadKasir();
      loadServiceTransaction();

      if (userRole === "admin") {
        loadDashboard();
        loadProducts();
        loadRiwayat();
        loadServiceDashboard();
        loadServiceHistory();
      }
    });
  }, [isLoggedIn, userRole]);

  useEffect(() => {
    if (!isLoggedIn) return;

    resetDocumentScroll();
    const frameId = window.requestAnimationFrame(resetDocumentScroll);
    const timeoutId = window.setTimeout(resetDocumentScroll, 250);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [isLoggedIn, renderedTab]);

  useEffect(() => {
    return () => {
      if (navigationFrameRef.current) {
        window.cancelAnimationFrame(navigationFrameRef.current);
      }
    };
  }, []);

  // useEffect(() => {
  //   if (!isLoggedIn) return;

  //   const canAnimate =
  //     window.matchMedia("(min-width: 768px)").matches &&
  //     !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  //   if (!canAnimate) return;

  //   Promise.all([import("aos"), import("aos/dist/aos.css")]).then(([AOS]) => {
  //     AOS.default.init({
  //       duration: 700,
  //       once: true,
  //       offset: 50,
  //     });
  //   });
  // }, [isLoggedIn]);

  const tabFallback =
    renderedTab === "dashboard" ? <DashboardSkeleton /> : <TableSkeleton />;

  const handleLogin = useCallback((role, name) => {
    setUserRole(role);
    setUserName(name);
    setIsLoggedIn(true);

    const initialTab = role === "admin" ? "dashboard" : "kasir";
    setActiveTab(initialTab);
    setRenderedTab(initialTab);

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", role);
    localStorage.setItem("userName", name);
    preloadPage(initialTab);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUserRole("");
    setUserName("");
    setProducts([]);
    handleClearTransactions();
    handleClearServiceTransactions();

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
  }, [handleClearServiceTransactions, handleClearTransactions]);

  const handleNavigation = useCallback((tab) => {
    preloadPage(tab);
    setActiveTab(tab);
    setIsMobileMenuOpen(false);

    if (navigationFrameRef.current) {
      window.cancelAnimationFrame(navigationFrameRef.current);
    }

    navigationFrameRef.current = window.requestAnimationFrame(() => {
      setRenderedTab(tab);
      navigationFrameRef.current = null;
    });
  }, []);



  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((isOpen) => !isOpen);
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleToggleServiceMenu = useCallback(() => {
    setIsServiceMenuOpen((isOpen) => !isOpen);
  }, []);

  const handleOpenLogoutModal = useCallback(() => {
    setIsLogoutModalOpen(true);
  }, []);


  if (!isLoggedIn) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-900 flex items-center justify-center text-sm font-semibold text-white">
            Memuat halaman masuk...
          </div>
        }
      >
        <Login onLoginSuccess={handleLogin} />
      </Suspense>
    );
  }


  return (
    // TAMBAHAN: dark:bg-slate-950 dark:text-gray-100 pada container utama
    <div className="h-screen [height:100dvh] overflow-hidden bg-gray-50 dark:bg-slate-950 flex flex-col md:flex-row font-helvetica text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <Sidebar
        activeTab={activeTab}
        userRole={userRole}
        userName={userName}
        isMobileMenuOpen={isMobileMenuOpen}
        isServiceMenuOpen={isServiceMenuOpen}
        onToggleMobileMenu={handleToggleMobileMenu}
        onCloseMobileMenu={handleCloseMobileMenu}
        onToggleServiceMenu={handleToggleServiceMenu}
        onNavigate={handleNavigation}
        onLogoutClick={handleOpenLogoutModal}
      />

      {/* Konten Utama - Tambahkan dark:bg-slate-900 */}
      <main className="flex-1 min-h-0 z-999 p-4 pb-24 md:p-6 overflow-y-auto overscroll-contain bg-gray-50 dark:bg-dashboardDark flex flex-col relative z-10 transition-colors duration-300 font-default">
        <Suspense fallback={tabFallback}>
          <>
            {renderedTab === "kasir" && (
              <Kasir
                products={products}
                fetchProducts={fetchProducts}
                onTransactionSaved={handleTransactionSaved}
                isLoading={isProductsLoading}
              />
            )}
            {renderedTab === "service-dashboard" && userRole === "admin" && (
              <ServiceDashboard
                serviceTransactions={serviceTransactions}
                fetchServiceTransactions={fetchServiceTransactions}
                refreshKey={serviceRefreshKey}
                isLoading={isServiceLoading}
              />
            )}
            {renderedTab === "service-transaction" && (
              <ServiceTransaction
                onServiceSaved={handleServiceSaved}
                fetchServiceTransactions={fetchServiceTransactions}
              />
            )}
            {renderedTab === "service-history" && userRole === "admin" && (
              <ServiceHistory
                serviceTransactions={serviceTransactions}
                setServiceTransactions={handleSetServiceTransactions}
                fetchServiceTransactions={fetchServiceTransactions}
                refreshKey={serviceRefreshKey}
                isLoading={isServiceLoading}
              />
            )}
            {renderedTab === "dashboard" &&
              userRole === "admin" &&
              (
                <Dashboard
                  products={products}
                  dataVersion={transactionsRefreshKey}
                />
              )}
            {renderedTab === "riwayat" && userRole === "admin" && (
              <Riwayat
                transactions={transactions}
                setTransactions={handleSetTransactions}
                fetchProducts={fetchProducts}
                fetchTransactions={fetchTransactions}
                refreshKey={transactionsRefreshKey}
                isLoading={isTransactionsLoading}
              />
            )}
            {renderedTab === "products" &&
              userRole === "admin" &&
              (isProductsLoading && products.length === 0 ? (
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

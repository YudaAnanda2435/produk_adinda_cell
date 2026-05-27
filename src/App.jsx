import { useState, useEffect } from "react";
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Database,
  Receipt,
  LogOut,
  Menu,
  X,
  Moon, // Import icon Moon
  Sun, // Import icon Sun
} from "lucide-react";
import AOS from "aos"
import { motion } from "framer-motion";
import "aos/dist/aos.css";
import { DashboardSkeleton, TableSkeleton } from "./components/Skeleton";
import ConfirmModal from "./components/ConfirmModal";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Kasir from "./pages/Kasir";
import Riwayat from "./pages/Riwayat";
import Login from "./pages/Login";
import * as api from "./services/api";
import { duration } from "@mui/material";
import AiAssistant from "./components/AiAssistant";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const [prodData, transData] = await Promise.all([
        api.getProducts(),
        api.getTransactions(),
      ]);
      setProducts(prodData ? [...prodData].reverse() : []);
      setTransactions(transData || []);
    } catch (error) {
      console.error("Gagal sinkronisasi data:", error);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn]);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 50,
    });
  }, []);

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
    setTransactions([]);

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
  };

  const handleNavigation = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLogin} />;
  }


  return (
    // TAMBAHAN: dark:bg-slate-950 dark:text-gray-100 pada container utama
    <div className="h-screen [height:100dvh] overflow-hidden bg-gray-50 dark:bg-slate-950 flex flex-col md:flex-row font-helvetica text-gray-800 dark:text-gray-100 transition-colors duration-300">
      {/* Header Mobile */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 dark:bg-black text-white p-4 shadow-md z-20 shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <Package className="text-blue-400" size={24} />
          <h1 className="text-lg font-bold tracking-wider">Stock Sperepart</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Tombol Toggle Tema Mobile */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1 text-slate-300 hover:text-yellow-400 transition-colors"
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-slate-300 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigasi */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-9999999 md:z-10 w-64 bg-slate-900 dark:bg-black text-white shadow-2xl flex flex-col 
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
                <motion.div
                  layoutId="active-sidebar-tab"
                  className="absolute inset-0 bg-slate-50 dark:bg-dashboardDark rounded-l-full nav-active-curve"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
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
              <motion.div
                layoutId="active-sidebar-tab"
                className="absolute inset-0 bg-slate-50 dark:bg-dashboardDark rounded-l-full nav-active-curve"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
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
                  <motion.div
                    layoutId="active-sidebar-tab"
                    className="absolute inset-0 bg-slate-50 dark:bg-dashboardDark rounded-l-full nav-active-curve"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
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
                  <motion.div
                    layoutId="active-sidebar-tab"
                    className="absolute inset-0 bg-slate-50 dark:bg-dashboardDark rounded-l-full nav-active-curve"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
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
        {isLoading ? (
          <>
            {activeTab === "kasir" && (
              <Kasir
                products={products}
                fetchProducts={fetchData}
                isLoading={true}
              />
            )}
            {activeTab === "dashboard" && <DashboardSkeleton />}
            {activeTab === "products" && <TableSkeleton />}
            {activeTab === "riwayat" && <TableSkeleton />}
          </>
        ) : (
          <>
            {activeTab === "kasir" && (
              <Kasir
                products={products}
                fetchProducts={fetchData}
                isLoading={false}
              />
            )}
            {activeTab === "dashboard" && userRole === "admin" && (
              <Dashboard products={products} transactions={transactions} />
            )}
            {activeTab === "riwayat" && userRole === "admin" && (
              <Riwayat
                transactions={transactions}
                setTransactions={setTransactions}
                fetchData={fetchData}
              />
            )}
            {activeTab === "products" && userRole === "admin" && (
              <Products
                products={products}
                fetchProducts={fetchData}
                setProducts={setProducts}
              />
            )}
          </>
        )}
      </main>

      <AiAssistant />

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

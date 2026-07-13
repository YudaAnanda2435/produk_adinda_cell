import { memo } from "react";
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Database,
  Receipt,
  LogOut,
  Menu,
  X,
  ChevronDown,
  BarChart3,
  ClipboardList,
  Wrench,
  Moon,
  Sun,
} from "lucide-react";
import { API_URL } from "../services/api";

const mainItemBase =
  "w-full flex items-center gap-3 cursor-pointer rounded-lg px-4 py-3 text-left text-sm font-semibold";

function MainNavButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`${mainItemBase} ${
        active
          ? "bg-slate-800 text-white"
          : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
      }`}
    >
      <span className="flex items-center">
        {icon} {children}
      </span>
    </button>
  );
}

function ServiceSubButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold ${
        active
          ? "bg-slate-800 text-white"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function Sidebar({
  activeTab,
  userRole,
  userName,
  isDarkMode,
  isMobileMenuOpen,
  isServiceMenuOpen,
  onToggleDarkMode,
  onToggleMobileMenu,
  onCloseMobileMenu,
  onToggleServiceMenu,
  onNavigate,
  onLogoutClick,
}) {
  const serviceMenuIsActive = activeTab.startsWith("service-");
  const canAccessAdmin = userRole === "admin";

  return (
    <>
      <div className="md:hidden font-default flex items-center justify-between bg-slate-900 dark:bg-black text-white p-4 pr-20 shadow-md z-20 shrink-0">
        <div className="flex items-center gap-2">
          <Package className="text-blue-400" size={24} />
          <h1 className="text-lg font-bold tracking-wider">Adinda Cell</h1>
        </div>
        <button
          onClick={onToggleDarkMode}
          className="p-1 text-slate-300 hover:text-yellow-400"
          aria-label={isDarkMode ? "Ganti tema terang" : "Ganti tema gelap"}
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      <button
        onClick={onToggleMobileMenu}
        className="fixed right-4 top-4 z-[10000000] p-1 text-slate-300 hover:text-white md:hidden"
        aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
      >
        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[9999998] md:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[9999999] md:z-10 w-64 bg-slate-900 dark:bg-black text-white shadow-lg flex flex-col transform transition-transform duration-200 ease-out md:relative md:translate-x-0 border-transparent dark:border-slate-800 [contain:layout_paint] ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 hidden md:flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-normal tracking-wider font-default flex items-center">
              <Package className="mr-3 text-blue-400" /> Adinda Cell
            </h2>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1 font-semibold">
              Halo, {userName} ({userRole})
            </p>
          </div>
          <button
            onClick={onToggleDarkMode}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-yellow-400"
            title={isDarkMode ? "Ganti Tema Terang" : "Ganti Tema Gelap"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="p-6 md:hidden border-b border-slate-800 mb-2">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            Masuk Sebagai:
          </p>
          <p className="text-lg font-bold text-white mt-1">{userName}</p>
          <p className="text-sm text-blue-400 capitalize">{userRole}</p>
        </div>

        <nav className="min-h-0 flex-1 font-default overflow-y-auto overscroll-contain px-4 space-y-2 mt-4 md:mt-0 [-webkit-overflow-scrolling:touch]">
          {canAccessAdmin && (
            <MainNavButton
              active={activeTab === "dashboard"}
              onClick={() => onNavigate("dashboard")}
              icon={<LayoutDashboard size={20} className="mr-3" />}
            >
              Dashboard
            </MainNavButton>
          )}

          <MainNavButton
            active={activeTab === "kasir"}
            onClick={() => onNavigate("kasir")}
            icon={<ShoppingCart size={20} className="mr-3" />}
          >
            Kasir Penjualan
          </MainNavButton>

          {canAccessAdmin && (
            <>
              <MainNavButton
                active={activeTab === "riwayat"}
                onClick={() => onNavigate("riwayat")}
                icon={<Receipt size={20} className="mr-3" />}
              >
                Riwayat Transaksi
              </MainNavButton>

              <MainNavButton
                active={activeTab === "products"}
                onClick={() => onNavigate("products")}
                icon={<Database size={20} className="mr-3" />}
              >
                Data Stok Produk
              </MainNavButton>

              <div>
                <button
                  onClick={onToggleServiceMenu}
                  className={`${mainItemBase} justify-between ${
                    serviceMenuIsActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <span className="flex items-center">
                    <Wrench size={20} className="mr-3" /> Service
                  </span>
                  <ChevronDown
                    size={18}
                    className={`mr-1 transition-transform duration-150 ${
                      isServiceMenuOpen || serviceMenuIsActive
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {(isServiceMenuOpen || serviceMenuIsActive) && (
                  <div className="ml-5 mt-2 space-y-1">
                    <ServiceSubButton
                      active={activeTab === "service-dashboard"}
                      onClick={() => onNavigate("service-dashboard")}
                      icon={<BarChart3 size={16} />}
                    >
                      Dashboard
                    </ServiceSubButton>
                    <ServiceSubButton
                      active={activeTab === "service-transaction"}
                      onClick={() => onNavigate("service-transaction")}
                      icon={<Wrench size={16} />}
                    >
                      Transaksi
                    </ServiceSubButton>
                    <ServiceSubButton
                      active={activeTab === "service-history"}
                      onClick={() => onNavigate("service-history")}
                      icon={<ClipboardList size={16} />}
                    >
                      Riwayat
                    </ServiceSubButton>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        <div className="p-4 mt-auto">
          <button
            onClick={onLogoutClick}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl mb-4"
          >
            <LogOut size={18} className="mr-2" /> Keluar
          </button>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div
                className={`h-2 w-2 rounded-full ${
                  API_URL ? "bg-green-400" : "bg-red-400"
                }`}
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-300 uppercase">
                  Status Server
                </span>
                <span className="text-[9px] text-slate-500 truncate w-32">
                  {API_URL ? "Terhubung ke Google Cloud" : "Koneksi Terputus"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default memo(Sidebar);

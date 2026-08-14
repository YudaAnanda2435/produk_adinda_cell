import { memo, useState } from "react";
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
  PanelRightOpen,
  PanelLeftOpen,
} from "lucide-react";
import { API_URL } from "../services/api";

function MainNavButton({ active, onClick, icon, children, isExpanded }) {
  return (
    <button
      onClick={onClick}
      title={!isExpanded ? children : undefined}
      className={`w-full flex items-center cursor-pointer rounded-lg py-3 text-[13px] font-semibold transition-all duration-200 pl-[14px] ${
        !isExpanded ? "justify-start" : "pr-4 text-left"
      } ${
        active
          ? "bg-slate-800 text-white"
          : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
      }`}
    >
      <span
        className={`flex items-center justify-center shrink-0 ${isExpanded ? "mr-3" : ""}`}
      >
        {icon}
      </span>
      {isExpanded && <span className="truncate">{children}</span>}
    </button>
  );
}

function ServiceSubButton({ active, onClick, icon, children, isExpanded }) {
  return (
    <button
      onClick={onClick}
      title={!isExpanded ? children : undefined}
      className={`w-full flex items-center rounded-lg py-2 text-[13px] font-semibold transition-all duration-200 pl-[16px] ${
        !isExpanded ? "justify-start" : "pr-3 text-left"
      } ${
        active
          ? "bg-slate-800 text-white"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
      }`}
    >
      <span
        className={`flex items-center justify-center shrink-0 ${isExpanded ? "mr-3" : ""}`}
      >
        {icon}
      </span>
      {isExpanded && <span className="truncate">{children}</span>}
    </button>
  );
}

function Sidebar({
  activeTab,
  userRole,
  userName,
  isMobileMenuOpen,
  isServiceMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
  onToggleServiceMenu,
  onNavigate,
  onLogoutClick,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const serviceMenuIsActive = activeTab.startsWith("service-");
  const canAccessAdmin = userRole === "admin";
  const expandedState = isExpanded || isMobileMenuOpen;

  return (
    <>
      <div className="md:hidden font-default flex items-center justify-between bg-slate-900 dark:bg-black text-white p-4 pr-20 shadow-md z-20 shrink-0">
        <div className="flex items-center gap-2">
          <Package className="text-blue-400" size={24} />
          <h1 className="text-lg font-semibold tracking-wider">Adinda Cell</h1>
        </div>
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
        className={`fixed inset-y-0 left-0 z-[9999999] md:z-10 bg-slate-900 dark:bg-black text-white shadow-lg flex flex-col transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 border-transparent dark:border-slate-800 [contain:layout_paint] ${
          isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
        } ${isExpanded ? "md:w-64" : "md:w-20"}`}
      >
        <div
          className={`py-6 pr-3 hidden md:flex items-center justify-between pl-7`}
        >
          {expandedState ? (
            <>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <Package className="text-blue-400 mr-3 shrink-0" size={24} />
                  <h2 className="text-xl font-semibold tracking-wider font-default truncate">
                    Adinda Cell
                  </h2>
                </div>
                {/* <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1 font-semibold">
                  Halo, {userName}
                </p> */}
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 ml-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white shrink-0 transition-colors"
                title="Tutup Sidebar"
              >
                <PanelRightOpen size={20} />
              </button>
            </>
          ) : (
            <div
              className="flex flex-col items-start cursor-pointer group"
              onClick={() => setIsExpanded(true)}
              title="Buka Sidebar"
            >
              <div className="relative flex items-center justify-start w-6 h-6">
                <Package
                  className="text-blue-400 transition-all duration-300 group-hover:opacity-0 group-hover:rotate-180 absolute left-0"
                  size={24}
                />
                <PanelLeftOpen
                  className="text-slate-300 transition-all duration-300 opacity-0 -rotate-180 group-hover:opacity-100 group-hover:rotate-0 absolute left-0"
                  size={24}
                />
              </div>
            </div>
          )}
        </div>



        <div className="p-6 md:hidden border-b border-slate-800 mb-2">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">
            Masuk Sebagai:
          </p>
          <p className="text-lg font-semibold text-white mt-1">{userName}</p>
          <p className="text-[13px] text-blue-400 capitalize">{userRole}</p>
        </div>

        <nav
          className={`min-h-0 flex-1 font-default overflow-y-auto overscroll-contain space-y-2 mt-4 md:mt-0 [-webkit-overflow-scrolling:touch] px-4`}
        >
          {canAccessAdmin && (
            <MainNavButton
              active={activeTab === "dashboard"}
              onClick={() => onNavigate("dashboard")}
              icon={<LayoutDashboard size={20} />}
              isExpanded={expandedState}
            >
              Dashboard
            </MainNavButton>
          )}

          <MainNavButton
            active={activeTab === "kasir"}
            onClick={() => onNavigate("kasir")}
            icon={<ShoppingCart size={20} />}
            isExpanded={expandedState}
          >
            Kasir Penjualan
          </MainNavButton>

          {canAccessAdmin && (
            <>
              <MainNavButton
                active={activeTab === "riwayat"}
                onClick={() => onNavigate("riwayat")}
                icon={<Receipt size={20} />}
                isExpanded={expandedState}
              >
                Riwayat Transaksi
              </MainNavButton>
              <MainNavButton
                active={activeTab === "products"}
                onClick={() => onNavigate("products")}
                icon={<Database size={20} />}
                isExpanded={expandedState}
              >
                Data Stok Produk
              </MainNavButton>
              <div>
                <button
                  onClick={onToggleServiceMenu}
                  title={!expandedState ? "Service" : undefined}
                  className={`w-full flex items-center cursor-pointer rounded-lg py-3 text-[13px] font-semibold transition-all duration-200 pl-[14px] ${
                    !expandedState
                      ? "justify-start"
                      : "pr-4 justify-between"
                  } ${
                    serviceMenuIsActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <span className="flex items-center shrink-0">
                    <span
                      className={`flex items-center justify-center shrink-0 ${expandedState ? "mr-3" : ""}`}
                    >
                      <Wrench size={20} />
                    </span>
                    {expandedState && <span>Service</span>}
                  </span>
                  {expandedState && (
                    <ChevronDown
                      size={18}
                      className={`mr-1 transition-transform duration-150 ${
                        isServiceMenuOpen || serviceMenuIsActive
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  )}
                </button>

                {(isServiceMenuOpen || serviceMenuIsActive) && (
                  <div
                    className={`mt-2 space-y-1`}
                  >
                    <ServiceSubButton
                      active={activeTab === "service-dashboard"}
                      onClick={() => onNavigate("service-dashboard")}
                      icon={<BarChart3 size={16} />}
                      isExpanded={expandedState}
                    >
                      Dashboard
                    </ServiceSubButton>
                    <ServiceSubButton
                      active={activeTab === "service-transaction"}
                      onClick={() => onNavigate("service-transaction")}
                      icon={<Wrench size={16} />}
                      isExpanded={expandedState}
                    >
                      Transaksi
                    </ServiceSubButton>
                    <ServiceSubButton
                      active={activeTab === "service-history"}
                      onClick={() => onNavigate("service-history")}
                      icon={<ClipboardList size={16} />}
                      isExpanded={expandedState}
                    >
                      Riwayat
                    </ServiceSubButton>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        <div
          className={`mt-auto px-4 pb-4 transition-all duration-300`}
        >
          <button
            onClick={onLogoutClick}
            title={!expandedState ? "Keluar" : undefined}
            className={`w-full flex items-center py-3 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl mb-4 transition-all duration-300 pl-[15px] ${expandedState ? "pr-4 justify-start" : "justify-start"}`}
          >
            <LogOut size={18} className={expandedState ? "mr-3" : ""} />
            {expandedState && "Keluar"}
          </button>

          <div 
            className={`overflow-hidden transition-all duration-300 ${expandedState ? "bg-slate-800/50 py-4 pr-4 pl-[20px] rounded-xl border border-slate-700/50" : "py-2 flex items-center justify-start pl-[20px]"}`} 
            title={!expandedState ? (API_URL ? "Server Terhubung" : "Server Terputus") : undefined}
          >
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full shrink-0 h-2 w-2 ${
                  API_URL ? "bg-green-400" : "bg-red-400"
                }`}
              />
              {expandedState && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-300 uppercase">
                    Status Server
                  </span>
                  <span className="text-[9px] text-slate-500 truncate w-32">
                    {API_URL ? "Terhubung ke Google Cloud" : "Koneksi Terputus"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default memo(Sidebar);

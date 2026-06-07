import { useState } from "react";
import { Lock, User, LogIn, CheckCircle2, AlertCircle } from 
  "lucide-react";
import Swiper1 from "../assets/swiper1.avif"
import * as api from "../services/api";

// Impor komponen Joy UI
import Snackbar from "@mui/joy/Snackbar";
import LinearProgress from "@mui/joy/LinearProgress";

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  // State khusus untuk Joy UI Snackbar
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarColor, setSnackbarColor] = useState("success");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOpenSnackbar(false); // Tutup notifikasi sebelumnya jika ada

    const res = await api.loginUser(formData);

    if (res.status === "success") {
      setSnackbarMessage("Login berhasil! Mengalihkan...");
      setSnackbarColor("success");
      setOpenSnackbar(true);

      // Beri jeda 1.5 detik agar notifikasi sukses terbaca sebelum pindah halaman
      setTimeout(() => {
        onLoginSuccess(res.role, formData.username);
      }, 1500);
    } else {
      setSnackbarMessage(res.message);
      setSnackbarColor("danger");
      setOpenSnackbar(true);
      setLoading(false); // Matikan loading hanya jika gagal
    }
  };

  return (
    <>
      <div className="min-h-screen relative flex flex-col md:flex-row-reverse bg-slate-900 overflow-hidden">
        <div className="w-full md:w-1/2 h-72 md:h-screen relative bg-blue-900">
          <img
            src={Swiper1}
            alt="Sistem POS terpadu untuk konter Adinda Cell"
            width="1440"
            height="1080"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

          <div className="relative z-10 p-8 md:p-16 flex flex-col items-start justify-center h-full w-full mx-auto pb-16 md:pb-24">
            <div className="flex items-center gap-2 bg-blue-600/30 backdrop-blur-md px-3 py-1.5 rounded-full mb-4 border border-blue-400/30">
              <CheckCircle2 size={14} className="text-blue-300" />
              <span className="text-xs font-bold text-blue-100 tracking-wider uppercase">
                Sistem POS Terpadu
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-white mb-3 leading-tight">
              Kendalikan Konter Anda!
            </h2>
            <p className="text-sm md:text-base text-blue-100 font-medium leading-relaxed opacity-90">
              Pencatatan otomatis, anti ribet. Laba bersih dan omzet harian
              langsung terlihat di layar Anda.
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center px-6 md:p-12 min-h-[calc(100vh-18rem)] pb-4 md:min-h-screen relative">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-full bg-white rounded-3xl h-full shadow-2xl p-6 md:p-10 relative z-10 border border-slate-100">
            <div className="text-center mb-6 md:mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 w-fit rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center mx-auto mb-3 md:mb-5 transform rotate-3 hover:rotate-6 transition-transform">
                <Lock className="text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                Akses Masuk
              </h1>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Sistem Manajemen Stok & Kasir Konter
              </p>
            </div>

            {/* Area Joy UI Linear Progress */}
            <div className="h-1 mb-2">
              {loading && <LinearProgress color="primary" thickness={3} />}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative flex flex-row items-center group">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full text-[16px] p-3 md:p-3.5 pl-10 md:pl-12 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 font-medium"
                    placeholder="Ketik username Anda"
                    required
                  />
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                    size={18}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full text-[16px] p-3 md:p-3.5 pl-10 md:pl-12 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 font-medium"
                    placeholder="Ketik kata sandi"
                    required
                  />
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                    size={18}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-[14px] md:text-[16px] hover:bg-blue-700 text-white font-bold py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 disabled:bg-slate-300 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memeriksa Akses...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} /> Masuk ke Dashboard
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Komponen Joy UI Snackbar diletakkan di luar struktur grid/flex utama */}
      <Snackbar
        autoHideDuration={3000}
        open={openSnackbar}
        variant="solid"
        color={snackbarColor}
        onClose={(event, reason) => {
          if (reason === "clickaway") return;
          setOpenSnackbar(false);
        }}
        startDecorator={
          snackbarColor === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )
        }
      >
        <span className="font-semibold tracking-wide text-[14px]">
          {snackbarMessage}
        </span>
      </Snackbar>
    </>
  );
}

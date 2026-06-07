// import { useState, useEffect, useRef } from "react";
// import { MessageCircle, Send, X, Bot, Trash2 } from "lucide-react";
// import ConfirmModal from "./ConfirmModal";
// import LoadingModal from "./LoadingModal";
// import puter from "@heyputer/puter.js";

// // --- 1. FUNGSI PEMBERSIH TEKS (Menghapus bintang markdown) ---
// const cleanAiText = (text) => {
//   return text
//     .replace(/\*\*(.*?)\*\*/g, "$1") // Menghapus bintang tebal (**teks**)
//     .replace(/\*/g, "•") // Mengganti sisa bintang list dengan titik (•)
//     .trim();
// };

// // --- 2. KOMPONEN EFEK MENGETIK ---
// const TypewriterText = ({ text, isTyping, onScroll }) => {
//   // Jika isTyping true, mulai dari kosong. Jika false (history lama), langsung tampilkan semua.
//   const [displayedText, setDisplayedText] = useState(isTyping ? "" : text);

//   useEffect(() => {
//     if (!isTyping) return;

//     let i = 0;
//     const timer = setInterval(() => {
//       if (i < text.length) {
//         setDisplayedText(text.substring(0, i + 1));
//         i++;
//         // Gulir layar otomatis ke bawah setiap mengetik beberapa huruf
//         if (i % 3 === 0 && onScroll) onScroll();
//       } else {
//         clearInterval(timer);
//       }
//     }, 15); // Kecepatan ketik: 15 milidetik per huruf (bisa diubah sesuai selera)

//     return () => clearInterval(timer);
//   }, [text, isTyping]);

//   // whitespace-pre-wrap adalah kunci agar baris baru (enter/angka 1,2,3) tersusun rapi ke bawah
//   return (
//     <div className="whitespace-pre-wrap leading-relaxed">{displayedText}</div>
//   );
// };

// // --- KOMPONEN UTAMA ---
// export default function AiAssistant({ initialOpen = false }) {
//   const [isOpen, setIsOpen] = useState(initialOpen);
//   const [input, setInput] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const chatEndRef = useRef(null);
//   const EXPIRATION_TIME = 48 * 60 * 60 * 1000;

//   const scrollToBottom = () => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     };
    
//     useEffect(() => {
//       if (isOpen) {
//         // Kita beri jeda sepersekian detik (50ms) agar React selesai
//         // menggambar kotak obrolan di layar sebelum menggulirnya ke bawah.
//         setTimeout(() => {
//           chatEndRef.current?.scrollIntoView({ behavior: "auto" });
//         }, 50);
//       }
//     }, [isOpen]);

//   useEffect(() => {
//     const savedData = localStorage.getItem("ai_chat_data");
//     if (savedData) {
//       const { timestamp, history } = JSON.parse(savedData);
//       const isExpired = Date.now() - timestamp > EXPIRATION_TIME;

//       if (isExpired) {
//         localStorage.removeItem("ai_chat_data");
//         setMessages([
//           {
//             role: "assistant",
//             content:
//               "Halo Bos! Selamat datang di Cell AI. Ada yang bisa saya bantu terkait stok sparepart atau penjualan hari ini?",
//             isTyping: false,
//           },
//         ]);
//       } else {
//         // Pastikan history lama tidak diketik ulang saat direfresh
//         const cleanHistory = history.map((msg) => ({
//           ...msg,
//           isTyping: false,
//         }));
//         setMessages(cleanHistory);
//       }
//     } else {
//       setMessages([
//         {
//           role: "assistant",
//           content:
//             "Halo Bos! Selamat datang di Cell AI. Ada yang bisa saya bantu terkait stok sparepart atau penjualan hari ini?",
//           isTyping: false,
//         },
//       ]);
//     }
//   }, []);

//   useEffect(() => {
//     if (messages.length > 1) {
//       const dataToSave = {
//         timestamp:
//           JSON.parse(localStorage.getItem("ai_chat_data"))?.timestamp ||
//           Date.now(),
//         history: messages,
//       };
//       localStorage.setItem("ai_chat_data", JSON.stringify(dataToSave));
//     }
//     scrollToBottom();
//   }, [messages]);

//   const handleConfirmDelete = async () => {
//     setShowDeleteConfirm(false);
//     setIsDeleting(true);

//     await new Promise((resolve) => setTimeout(resolve, 1500));

//     localStorage.removeItem("ai_chat_data");
//     setMessages([
//       {
//         role: "assistant",
//         content:
//           "Halo Bos! Selamat datang di Cell AI. Riwayat obrolan sudah dibersihkan. Ada yang bisa dibantu?",
//         isTyping: true,
//       },
//     ]);

//     setIsDeleting(false);
//   };

//   const handleSendMessage = async () => {
//     if (!input.trim() || isLoading) return;

//     const userMessage = { role: "user", content: input };
//     const currentMessages = [...messages, userMessage];
//     setMessages(currentMessages);
//     setInput("");
//     setIsLoading(true); // Memunculkan animasi 3 titik

//     try {
//       const systemInstructionData = `
// Identitas: Kamu adalah "Cell AI", asisten AI cerdas dan ramah untuk aplikasi manajemen konter HP bernama 'Cell Stok'. 

// Tujuan: Membantu kasir dan admin mengelola operasional toko, menganalisis data penjualan, dan memberikan saran terkait teknis sparepart HP.

// Konteks Aplikasi:
// 1. Dashboard: Menampilkan Laba Bersih, Omzet, Produk Terjual, Nilai Aset Modal, total Stok, jenis sperepart dan ada peringatan Stok Kritis (< 6 unit).
// 2. Grafik: Memiliki Grafik Omzet (Harian/Bulanan) berdasarkan kustom tanggal dan Grafik Pie Distribusi Sparepart.
// 3. Fitur: Memiliki Kasir Penjualan, Riwayat Transaksi, dan Manajemen Stok Produk.
// 4. Bisa mencetak laporan penjualan berdasarkan tanggal tertentu.

// Aturan Perilaku:
// - Gunakan bahasa yang jelas, sederhana, dan ringkas. Jangan gunakan tanda bintang (*) untuk menebalkan teks.
// - HANYA jawab pertanyaan seputar: Sparepart HP (LCD, Baterai, dll), Stok Gudang, Analisis Penjualan, Laba Rugi, dan Tips Konter.
// - Setiap balasan pertama harus diawali dengan sapaan seperti 'Halo Bos'.
// - Tolak dengan sopan jika ditanya di luar topik konter.
// - Buat daftar poin (1, 2, 3) dengan baris baru yang rapi.
// `;

//       // 1. Format riwayat pesan khusus untuk standar Puter/OpenAI
//       const formattedHistory = [
//         { role: "system", content: systemInstructionData },
//         ...currentMessages.map((m) => ({
//           role: m.role,
//           content: m.content,
//         })),
//       ];

//       // 2. Panggil API Grok melalui Puter.js (Tanpa API Key)
//       const response = await puter.ai.chat(formattedHistory, {
//         model: "x-ai/grok-4-1-fast",
//       });

//       // TAMBAHAN: Cetak data asli ke console agar kita tahu isinya!
//       console.log("Data Asli dari Puter:", response);

//       // 3. Tangkap dan bersihkan respons
//       if (response && response.message && response.message.content) {
//         const rawAiText = response.message.content;
//         const cleanText = cleanAiText(rawAiText);

//         const aiResponse = {
//           role: "assistant",
//           content: cleanText,
//           isTyping: true,
//         };
//         setMessages((prev) => [...prev, aiResponse]);
//       } else {
//         throw new Error("Format respons API tidak sesuai.");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       const errorMsg = {
//         role: "assistant",
//         content: `🚨 Sistem Error: ${error.message}`,
//         isTyping: false,
//       };
//       setMessages((prev) => [...prev, errorMsg]);
//     } finally {
//       setIsLoading(false); // Matikan animasi 3 titik
//     }
//   };

//   const handleKeyDown = (e) => {
//     // Jika tombol yang ditekan adalah Enter
//     if (e.key === "Enter") {
//       // 1. Abaikan jika sedang menggunakan auto-complete / memilih kata (IME composition)
//       if (e.nativeEvent.isComposing) return;

//       // 2. Cegah perilaku bawaan browser yang kadang memicu hal lain
//       e.preventDefault();

//       // 3. Baru kirim pesan
//       handleSendMessage();
//     }
//   };

//   // --- TAMBAHKAN FUNGSI INI DI ATAS return ---
//   const closeChat = () => {
//     setIsOpen(false); // Tutup jendela
//     // Matikan semua efek ngetik agar saat dibuka lagi langsung muncul semua
//     setMessages((prev) => prev.map((msg) => ({ ...msg, isTyping: false })));
//   };

//   return (
//     <>
//       {isOpen && (
//         <div
//           className="fixed inset-0 bg-slate-900/30 z-999 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
//           onClick={closeChat}
//         />
//       )}

//       <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end">
//         {isOpen && (
//           <div className="relative mb-4 w-80 md:w-96 h-[500px] bg-white dark:bg-slate-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
//             <ConfirmModal
//               open={showDeleteConfirm}
//               onClose={() => setShowDeleteConfirm(false)}
//               onConfirm={handleConfirmDelete}
//               title="Hapus Obrolan AI?"
//               message="Semua riwayat percakapan Anda dengan asisten Cell AI akan dihapus secara permanen."
//             />

//             <LoadingModal open={isDeleting} />

//             <div className="p-4 bg-blue-600 text-white flex justify-between items-center z-10">
//               <div className="flex items-center gap-2">
//                 <Bot size={20} />
//                 <span className="font-bold">Asisten Cell AI</span>
//               </div>

//               <div className="flex items-center gap-4">
//                 <button
//                   onClick={() => setShowDeleteConfirm(true)}
//                   className="hover:text-red-300 transition-colors"
//                   title="Hapus riwayat chat"
//                 >
//                   <Trash2 size={18} />
//                 </button>

//                 <button
//                   onClick={closeChat}
//                   className="hover:text-gray-200 transition-colors"
//                   title="Tutup chat"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900 scroll-smooth">
//               {messages.map((msg, i) => (
//                 <div
//                   key={i}
//                   className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
//                 >
//                   <div
//                     className={`max-w-[85%] p-3 rounded-2xl text-sm ${
//                       msg.role === "user"
//                         ? "bg-blue-600 text-white rounded-tr-none"
//                         : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-slate-700 rounded-tl-none"
//                     }`}
//                   >
//                     {/* Menggunakan Komponen Animasi Ketik Khusus Pesan AI */}
//                     {msg.role === "assistant" ? (
//                       <TypewriterText
//                         text={msg.content}
//                         isTyping={msg.isTyping}
//                         onScroll={scrollToBottom}
//                       />
//                     ) : (
//                       <div className="whitespace-pre-wrap">{msg.content}</div>
//                     )}
//                   </div>
//                 </div>
//               ))}

//               {/* Animasi Loading (3 titik) */}
//               {isLoading && (
//                 <div className="flex justify-start animate-in fade-in duration-300">
//                   <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-1.5">
//                     <span className="w-2 h-2 bg-blue-500/80 rounded-full animate-bounce"></span>
//                     <span className="w-2 h-2 bg-blue-500/80 rounded-full animate-bounce delay-100"></span>
//                     <span className="w-2 h-2 bg-blue-500/80 rounded-full animate-bounce delay-200"></span>
//                   </div>
//                 </div>
//               )}

//               <div ref={chatEndRef} />
//             </div>

//             <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex gap-2 z-10">
//               <input
//                 type="text"
//                 value={input}
//                 disabled={isLoading}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 // onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
//                 placeholder={
//                   isLoading ? "AI sedang berpikir..." : "Ketik pesan di sini..."
//                 }
//                 className="flex-1 bg-gray-100 dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white outline-none disabled:opacity-50"
//               />
//               <button
//                 onClick={handleSendMessage}
//                 disabled={isLoading}
//                 className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
//               >
//                 <Send size={18} />
//               </button>
//             </div>
//           </div>
//         )}

//         <button
//           onClick={() => (isOpen ? closeChat() : setIsOpen(true))}
//           className={`w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-300 ${isOpen ? "rotate-90" : "rotate-0"}`}
//         >
//           {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
//         </button>
//       </div>
//     </>
//   );
// }

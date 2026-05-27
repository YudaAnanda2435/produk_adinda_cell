export const API_URL = "https://script.google.com/macros/s/AKfycbxGLholaEqaDnuC80GlZCwW7sGFhiS3yRVFJIKaJmK2MZ50YCBqo1IHLLcKXiqKdJY/exec"

  // "https://script.google.com/macros/s/AKfycbxHQ_T4DJulSvfZ1lifki19J_0AZvYhtyj2zydNlJXcG3Xw2S7YUPPatXA9AmDNGSrqyw/exec";

export const getProducts = async () => {
  try {
    const response = await fetch(API_URL);
    return await response.json();
  } catch (error) {
    console.error("Gagal mengambil data", error);
    return [];
  }
};

const sendPostRequest = async (action, data) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      // Jangan gunakan mode: "no-cors" agar React bisa membaca balasan server
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action, data }),
    });

    // Tangkap dan kembalikan jawaban asli dari Google Apps Script
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Gagal melakukan operasi ${action}`, error);
    return { status: "error", message: "Gagal terhubung ke server" };
  }
};

export const getTransactions = async () => {
  try {
    // Kita tambahkan parameter ?sheet=transaksi agar script tahu tab mana yang diambil
    const response = await fetch(`${API_URL}?sheet=transaksi`);
    return await response.json();
  } catch (error) {
    console.error("Gagal mengambil data transaksi", error);
    return [];
  }
};

export const loginUser = (data) => sendPostRequest("login", data);
export const addProduct = (data) => sendPostRequest("create", data);
export const updateProduct = (data) => sendPostRequest("update", data);
export const deleteProduct = (id) => sendPostRequest("delete", { id });
export const checkout = (data) => sendPostRequest("checkout", data);
export const deleteTransaction = (id) =>
  sendPostRequest("delete_transaction", { id });

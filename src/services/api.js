export const API_URL =
  "https://script.google.com/macros/s/AKfycbzBeENMmZIgG_j3ev3EtjePLn6eQd38AXSMZ3P0vYV7Vo5z5TGMGrrsNuPnQ9hQP35n/exec";
  // "https://script.google.com/macros/s/AKfycbwqxg4GnOmg7n1z1-00PtCPQYM9T68QpiwSY8dyjDxwnFp41RhUTxp1_JZNtAAtvbiy/exec";

// "https://script.google.com/macros/s/AKfycbxHQ_T4DJulSvfZ1lifki19J_0AZvYhtyj2zydNlJXcG3Xw2S7YUPPatXA9AmDNGSrqyw/exec";

const buildUrl = (params = {}) => {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
};

const normalizeArrayResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  return [];
};

const createDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildChartSlots = (startDate, endDate) => {
  if (!startDate || !endDate) return {};

  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayDiff = (end - start) / (1000 * 60 * 60 * 24);
  const isMonthly = dayDiff > 31;
  const grouped = {};

  if (isMonthly) {
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (current <= last) {
      const key = `${current.getFullYear()}-${String(
        current.getMonth() + 1,
      ).padStart(2, "0")}`;
      const month = current.toLocaleString("id-ID", { month: "short" });
      grouped[key] = {
        date: key,
        label: `${month} ${current.getFullYear()}`,
        omzet: 0,
      };
      current.setMonth(current.getMonth() + 1);
    }
    return grouped;
  }

  const current = new Date(start.setHours(0, 0, 0, 0));
  const last = new Date(end.setHours(0, 0, 0, 0));
  while (current <= last) {
    const key = createDateKey(current);
    const day = String(current.getDate()).padStart(2, "0");
    const month = String(current.getMonth() + 1).padStart(2, "0");
    grouped[key] = { date: key, label: `${day}/${month}`, omzet: 0 };
    current.setDate(current.getDate() + 1);
  }

  return grouped;
};

const calculateDashboardSummary = (transactions, startDate, endDate) => {
  const startTime = startDate
    ? new Date(startDate).setHours(0, 0, 0, 0)
    : Number.NEGATIVE_INFINITY;
  const endTime = endDate
    ? new Date(endDate).setHours(23, 59, 59, 999)
    : Number.POSITIVE_INFINITY;
  const chartSlots = buildChartSlots(startDate, endDate);

  const filteredTransactions = transactions.filter((transaction) => {
    const transactionTime = new Date(transaction.tanggal).getTime();
    return transactionTime >= startTime && transactionTime <= endTime;
  });

  const stats = filteredTransactions.reduce(
    (result, transaction) => {
      result.unitTerjual += Number(transaction.jumlah) || 0;
      result.labaBersih += Number(transaction.laba) || 0;
      result.omzetTotal += Number(transaction.total_harga) || 0;

      const date = new Date(transaction.tanggal);
      const dayDiff =
        startDate && endDate
          ? (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
          : 0;
      const chartKey =
        dayDiff > 31
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
              2,
              "0",
            )}`
          : createDateKey(date);

      if (chartSlots[chartKey]) {
        chartSlots[chartKey].omzet += Number(transaction.total_harga) || 0;
      }

      return result;
    },
    { unitTerjual: 0, labaBersih: 0, omzetTotal: 0 },
  );

  return {
    ...stats,
    barChartData: Object.keys(chartSlots)
      .sort()
      .map((key) => chartSlots[key]),
  };
};

const normalizeDashboardSummary = (payload) => {
  if (!payload || Array.isArray(payload) || payload.status === "error") {
    return null;
  }

  const source = payload.data || payload;
  const stats = source.stats || source;

  return {
    unitTerjual: Number(stats.unitTerjual ?? stats.unit_terjual) || 0,
    labaBersih: Number(stats.labaBersih ?? stats.laba_bersih) || 0,
    omzetTotal: Number(stats.omzetTotal ?? stats.omzet_total) || 0,
    barChartData:
      source.barChartData || source.chartData || source.grafikOmzet || [],
  };
};

export const getProducts = async () => {
  try {
    const response = await fetch(API_URL, { cache: "no-store" });
    return normalizeArrayResponse(await response.json());
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

export const getTransactions = async ({
  startDate,
  endDate,
  limit,
  refreshKey,
} = {}) => {
  try {
    const response = await fetch(
      buildUrl({
        sheet: "transaksi",
        startDate,
        endDate,
        limit,
        refresh: refreshKey,
      }),
      { cache: "no-store" },
    );
    return normalizeArrayResponse(await response.json());
  } catch (error) {
    console.error("Gagal mengambil data transaksi", error);
    return [];
  }
};

export const getServiceTransactions = async ({
  startDate,
  endDate,
  refreshKey,
} = {}) => {
  try {
    const response = await fetch(
      buildUrl({
        sheet: "service_transactions",
        startDate,
        endDate,
        refresh: refreshKey,
      }),
      { cache: "no-store" },
    );
    return normalizeArrayResponse(await response.json());
  } catch (error) {
    console.error("Gagal mengambil data service", error);
    return [];
  }
};

export const getDashboardSummary = async ({
  startDate,
  endDate,
  refreshKey,
} = {}) => {
  try {
    const response = await fetch(
      buildUrl({
        action: "dashboard_summary",
        sheet: "dashboard",
        startDate,
        endDate,
        refresh: refreshKey,
      }),
      { cache: "no-store" },
    );
    const summary = normalizeDashboardSummary(await response.json());
    if (summary) return summary;
  } catch (error) {
    console.warn("Endpoint ringkasan dashboard belum tersedia.", error);
  }

  const transactions = await getTransactions({ startDate, endDate, refreshKey });
  return calculateDashboardSummary(transactions, startDate, endDate);
};

export const loginUser = (data) => sendPostRequest("login", data);
export const addProduct = (data) => sendPostRequest("create", data);
export const updateProduct = (data) => sendPostRequest("update", data);
export const deleteProduct = (id) => sendPostRequest("delete", { id });
export const checkout = (data) => sendPostRequest("checkout", data);
export const deleteTransaction = (id) =>
  sendPostRequest("delete_transaction_history", { id });
export const deleteAllTransactions = (data) =>
  sendPostRequest("delete_all_transactions", data);
export const addServiceTransaction = (data) =>
  sendPostRequest("create_service_transaction", data);
export const deleteServiceTransaction = (id) =>
  sendPostRequest("delete_service_transaction", { id });
export const deleteAllServiceTransactions = (data) =>
  sendPostRequest("delete_all_service_transactions", data);

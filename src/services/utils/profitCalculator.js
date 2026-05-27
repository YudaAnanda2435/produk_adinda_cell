const calculateProfit = (hargaJual, hargaBeli) => {
  return Number(hargaJual) - Number(hargaBeli);
};

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export { calculateProfit, formatRupiah };
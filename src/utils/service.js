export const formatRupiah = (angka) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka || 0);

export const getServiceDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 2)
    .toISOString()
    .split("T")[0];
  const end = now.toISOString().split("T")[0];

  return { start, end };
};

export const formatDateLabel = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

export const filterServiceByDate = (services, startDate, endDate) => {
  if (!startDate || !endDate) return services;

  const startTime = new Date(startDate).setHours(0, 0, 0, 0);
  const endTime = new Date(endDate).setHours(23, 59, 59, 999);

  return services.filter((service) => {
    const serviceTime = new Date(service.tanggal).getTime();
    return serviceTime >= startTime && serviceTime <= endTime;
  });
};

const normalizeNumericValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value === undefined || value === null || value === "") return 0;

  const text = String(value).trim();
  const numericText = text
    .replace(/rp/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsedValue = Number(numericText);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getFirstNumericField = (source, fieldNames) => {
  for (const fieldName of fieldNames) {
    const value = normalizeNumericValue(source?.[fieldName]);
    if (value > 0) return value;
  }

  return 0;
};

export const getServiceSparepartCost = (service) => {
  const sparepartCost = getFirstNumericField(service, [
    "modal_sparepart",
    "sparepart",
    "sparepart_komponen",
    "harga_sparepart",
    "biaya_sparepart",
    "komponen",
    "harga_komponen",
    "Modal Sparepart",
    "Modal sparepart",
    "Sparepart / Komponen",
    "sparepart / komponen",
  ]);
  if (sparepartCost > 0) return sparepartCost;

  const totalModal = getFirstNumericField(service, [
    "total_modal",
    "Total Modal",
    "total modal",
  ]);
  if (totalModal > 0) return totalModal;

  const totalBayar = getFirstNumericField(service, [
    "harga_jasa",
    "total_bayar",
    "Harga Jasa",
    "Total Bayar",
    "total bayar",
  ]);
  const laba = getFirstNumericField(service, [
    "laba",
    "Laba",
    "Laba Service",
    "laba service",
  ]);

  return totalBayar > laba ? totalBayar - laba : 0;
};

export const getServiceTotalBayar = (service) =>
  getFirstNumericField(service, [
    "harga_jasa",
    "total_bayar",
    "Harga Jasa",
    "Total Bayar",
    "total bayar",
  ]);

export const getServiceLaba = (service) => {
  const savedLaba = normalizeNumericValue(service.laba);
  if (
    service.laba !== undefined &&
    service.laba !== null &&
    service.laba !== "" &&
    savedLaba > 0
  ) {
    return savedLaba;
  }

  return getServiceTotalBayar(service) - getServiceSparepartCost(service);
};

export const getServiceStats = (services) =>
  services.reduce(
    (result, service) => {
      const sparepartCost = getServiceSparepartCost(service);
      const totalBayar = getServiceTotalBayar(service);
      const laba = getServiceLaba(service);

      result.totalTransaksi += 1;
      result.totalModal += sparepartCost;
      result.totalSparepart += sparepartCost;
      result.totalJasa += totalBayar;
      result.totalBayar += totalBayar;
      result.totalLaba += laba;
      return result;
    },
    {
      totalTransaksi: 0,
      totalModal: 0,
      totalSparepart: 0,
      totalJasa: 0,
      totalBayar: 0,
      totalLaba: 0,
    },
  );

import qz from "qz-tray";
import {
  RECEIPT_ADDRESS_LINES,
  RECEIPT_CONTACT,
  RECEIPT_LOGO_SRC,
  RECEIPT_STORE_NAME,
  RECEIPT_TAGLINE,
  formatReceiptAmount,
} from "./receipt";

const ESC = "\x1B";
const GS = "\x1D";
const RECEIPT_COLUMNS = 32;
const PRINTER_STORAGE_KEY = "adinda-thermal-printer";
const LOGO_MAX_WIDTH = 180;

const normalizeText = (value) =>
  String(value ?? "-")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const centerText = (text) => {
  const normalized = normalizeText(text);
  const padding = Math.max(0, Math.floor((RECEIPT_COLUMNS - normalized.length) / 2));
  return `${" ".repeat(padding)}${normalized}`;
};

const divider = () => "-".repeat(RECEIPT_COLUMNS);

const wrapText = (text, width = RECEIPT_COLUMNS) => {
  const words = normalizeText(text).split(" ").filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length <= width) {
      line = nextLine;
      return;
    }

    if (line) lines.push(line);

    if (word.length <= width) {
      line = word;
      return;
    }

    for (let index = 0; index < word.length; index += width) {
      lines.push(word.slice(index, index + width));
    }
    line = "";
  });

  if (line) lines.push(line);
  return lines.length > 0 ? lines : ["-"];
};

const pairLine = (left, right, width = RECEIPT_COLUMNS) => {
  const cleanRight = normalizeText(right);
  const rightWidth = Math.min(11, cleanRight.length);
  const leftWidth = width - rightWidth - 1;
  const cleanLeft = normalizeText(left).slice(0, leftWidth);
  return `${cleanLeft.padEnd(leftWidth, " ")} ${cleanRight.padStart(rightWidth, " ")}`;
};

const addCentered = (lines, text) => {
  wrapText(text, RECEIPT_COLUMNS).forEach((line) => lines.push(centerText(line)));
};

const buildReceiptText = ({
  receiptData,
  receiptItems,
  receiptSubtotal,
  receiptShipping,
  receiptGrandTotal,
}) => {
  const lines = [];

  addCentered(lines, RECEIPT_STORE_NAME);
  addCentered(lines, RECEIPT_TAGLINE);
  RECEIPT_ADDRESS_LINES.forEach((line) => addCentered(lines, line));
  addCentered(lines, RECEIPT_CONTACT);
  lines.push(divider());
  lines.push(pairLine(`Bill ${receiptData.billNumber}`, receiptData.tanggal));
  lines.push(pairLine("", receiptData.jam));
  lines.push(divider());
  lines.push(pairLine("Item x Qty", "Rate"));
  lines.push(divider());

  receiptItems.forEach((item) => {
    const total = formatReceiptAmount(item.total_harga);
    wrapText(item.nama_produk, 20).forEach((line, index) => {
      lines.push(index === 0 ? pairLine(line, total) : line);
    });

    if (item.keterangan && item.keterangan !== "-") {
      wrapText(`(${item.keterangan})`, 24).forEach((line) => lines.push(line));
    }

    lines.push(
      pairLine(
        `${item.jumlah} x ${formatReceiptAmount(item.harga_satuan)}`,
        total,
      ),
    );
  });

  lines.push(divider());
  lines.push(pairLine("Total pesanan", formatReceiptAmount(receiptSubtotal)));
  lines.push(pairLine("Ongkir", formatReceiptAmount(receiptShipping)));
  lines.push(pairLine("Total bayar", formatReceiptAmount(receiptGrandTotal)));
  lines.push(divider());
  addCentered(lines, "TERIMA KASIH");

  return `${lines.join("\n")}\n\n\n`;
};

const loadImage = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

const createLogoBase64 = async () => {
  const image = await loadImage(RECEIPT_LOGO_SRC);
  if (!image) return null;

  const ratio = Math.min(1, LOGO_MAX_WIDTH / image.width);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
};

const buildEscPosTextCommands = (receiptPayload) =>
  [
    `${ESC}a\x01`,
    `${ESC}E\x01`,
    `${ESC}!\x08`,
    buildReceiptText(receiptPayload),
    `${ESC}!\x00`,
    `${ESC}E\x00`,
    `${ESC}a\x00`,
    `${GS}V\x42\x00`,
  ].join("");

const buildEscPosPrintData = async (receiptPayload) => {
  const logoBase64 = await createLogoBase64();
  const printData = [
    {
      type: "raw",
      format: "command",
      data: `${ESC}@${ESC}t\x00${ESC}a\x01`,
    },
  ];

  if (logoBase64) {
    printData.push({
      type: "raw",
      format: "image",
      flavor: "base64",
      data: logoBase64,
      options: {
        language: "escpos",
        dotDensity: "double",
        imageEncoding: "esc_asterisk",
        threshold: 160,
      },
    });
    printData.push({
      type: "raw",
      format: "command",
      data: "\n",
    });
  }

  printData.push({
    type: "raw",
    format: "command",
    data: buildEscPosTextCommands(receiptPayload),
  });

  return printData;
};

const ensureConnection = async () => {
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect({ retries: 1, delay: 1 });
  }
};

const getTargetPrinter = async () => {
  const savedPrinter = localStorage.getItem(PRINTER_STORAGE_KEY);
  if (savedPrinter) return savedPrinter;

  const defaultPrinter = await qz.printers.getDefault();
  localStorage.setItem(PRINTER_STORAGE_KEY, defaultPrinter);
  return defaultPrinter;
};

export const clearSavedThermalPrinter = () => {
  localStorage.removeItem(PRINTER_STORAGE_KEY);
};

export const printThermalReceipt = async (receiptPayload) => {
  await ensureConnection();
  const printer = await getTargetPrinter();
  const config = qz.configs.create(printer, {
    encoding: "CP437",
    altPrinting: true,
  });

  await qz.print(config, await buildEscPosPrintData(receiptPayload));

  return printer;
};

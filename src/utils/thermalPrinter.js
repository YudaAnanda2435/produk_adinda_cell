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
const LOGO_MAX_WIDTH = 64;

const normalizeText = (value) =>
  String(value ?? "-")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();

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

const buildHeaderText = () => {
  const lines = [];
  wrapText(RECEIPT_STORE_NAME, RECEIPT_COLUMNS).forEach((line) =>
    lines.push(line),
  );
  wrapText(RECEIPT_TAGLINE, RECEIPT_COLUMNS).forEach((line) =>
    lines.push(line),
  );
  RECEIPT_ADDRESS_LINES.forEach((addressLine) => {
    wrapText(addressLine, RECEIPT_COLUMNS).forEach((line) => lines.push(line));
  });
  wrapText(RECEIPT_CONTACT, RECEIPT_COLUMNS).forEach((line) =>
    lines.push(line),
  );
  return `${lines.join("\n")}\n`;
};

const buildBodyText = ({
  receiptData,
  receiptItems,
  receiptSubtotal,
  receiptShipping,
  receiptGrandTotal,
}) => {
  const lines = [];

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

  return `${lines.join("\n")}\n`;
};

const loadImage = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

// Membangun ESC/POS GS v 0 raster image command secara manual.
// Metode ini identik dengan cara kerja app thermal di HP (Bluetooth),
// sehingga kompatibel dengan printer yang tidak support QZ Tray image handler.
const buildLogoRasterCommand = async () => {
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

  const imageData = context.getImageData(0, 0, width, height);

  // Konversi ke 1-bit bitmap: 1 byte = 8 pixel horizontal, MSB kiri
  const bytesPerRow = Math.ceil(width / 8);
  const bitmapBytes = [];

  for (let y = 0; y < height; y++) {
    for (let byteIdx = 0; byteIdx < bytesPerRow; byteIdx++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteIdx * 8 + bit;
        if (x < width) {
          const px = (y * width + x) * 4;
          const r = imageData.data[px];
          const g = imageData.data[px + 1];
          const b = imageData.data[px + 2];
          const a = imageData.data[px + 3];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          // Pixel gelap (logo) = bit 1
          if (a >= 80 && luma <= 128) byte |= 0x80 >> bit;
        }
      }
      bitmapBytes.push(byte);
    }
  }

  // GS v 0 command: 1D 76 30 00 xL xH yL yH [data]
  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;

  const command = [
    0x1b, 0x61, 0x01,             // ESC a 1 — center alignment
    0x1d, 0x76, 0x30, 0x00,       // GS v 0, normal density
    xL, xH, yL, yH,               // lebar (bytes) dan tinggi (dots)
    ...bitmapBytes,                // data bitmap
    0x1b, 0x61, 0x00, 0x0a,       // ESC a 0 — kembali left, + line feed
  ];

  // Encode ke base64 untuk dikirim sebagai raw command
  return btoa(String.fromCharCode(...command));
};

const centerText = (text, width = RECEIPT_COLUMNS) => {
  const cleaned = normalizeText(text);
  if (cleaned.length >= width) return cleaned;
  const padding = Math.floor((width - cleaned.length) / 2);
  return " ".repeat(padding) + cleaned;
};

const buildHeaderTextCentered = () => {
  const lines = [];
  wrapText(RECEIPT_STORE_NAME, RECEIPT_COLUMNS).forEach((line) =>
    lines.push(centerText(line)),
  );
  wrapText(RECEIPT_TAGLINE, RECEIPT_COLUMNS).forEach((line) =>
    lines.push(centerText(line)),
  );
  RECEIPT_ADDRESS_LINES.forEach((addressLine) => {
    wrapText(addressLine, RECEIPT_COLUMNS).forEach((line) =>
      lines.push(centerText(line)),
    );
  });
  wrapText(RECEIPT_CONTACT, RECEIPT_COLUMNS).forEach((line) =>
    lines.push(centerText(line)),
  );
  return `${lines.join("\n")}\n`;
};

const buildEscPosTextCommands = (receiptPayload) =>
  [
    `${ESC}a\x00`,
    `${ESC}E\x01`,
    `${ESC}!\x00`,
    buildHeaderTextCentered(),
    `${ESC}!\x00`,
    `${ESC}E\x00`,
    buildBodyText(receiptPayload),
    `${ESC}a\x01`,
    "TERIMA KASIH\n\n\n\n\n",
    `${ESC}a\x00`,
    `${GS}V\x42\x00`,
  ].join("");

const buildEscPosPrintData = async (receiptPayload) => {
  const logoRasterCommand = await buildLogoRasterCommand();
  const printData = [
    {
      type: "raw",
      format: "command",
      data: `${ESC}@${ESC}t\x00`,
    },
  ];

  if (logoRasterCommand) {
    // Kirim GS v 0 raster command secara langsung sebagai raw bytes
    printData.push({
      type: "raw",
      format: "command",
      flavor: "base64",
      data: logoRasterCommand,
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

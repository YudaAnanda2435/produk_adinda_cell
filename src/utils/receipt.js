export const RECEIPT_LOGO_SRC = "/adinda.png";
export const RECEIPT_STORE_NAME = "ADINDA CELLULAR";
export const RECEIPT_TAGLINE = "Service HP & Jual sparepart";
export const RECEIPT_ADDRESS_LINES = [
  "Jln.pasir ipis surade ",
  "(pertigaan smk bina bangsa)",
];
export const RECEIPT_CONTACT = "Contact: 0858-8040-4783";

export const formatReceiptAmount = (value) =>
  Number(value || 0).toLocaleString("id-ID");

export const formatReceiptDate = (date = new Date()) =>
  date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export const formatReceiptTime = (date = new Date()) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const RECEIPT_IMAGE_WIDTH = 384;
const RECEIPT_IMAGE_PADDING = 6;

const loadReceiptImage = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

const wrapCanvasText = (context, text, maxWidth) => {
  const source = String(text || "-");
  const words = source.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
      return;
    }

    if (currentLine) lines.push(currentLine);

    if (context.measureText(word).width <= maxWidth) {
      currentLine = word;
      return;
    }

    let chunk = "";
    word.split("").forEach((char) => {
      const testChunk = `${chunk}${char}`;
      if (context.measureText(testChunk).width <= maxWidth) {
        chunk = testChunk;
      } else {
        if (chunk) lines.push(chunk);
        chunk = char;
      }
    });
    currentLine = chunk;
  });

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : ["-"];
};

export const createReceiptPngDataUrl = async ({
  receiptData,
  receiptItems,
  receiptSubtotal,
  receiptShipping,
  receiptGrandTotal,
}) => {
  const logo = await loadReceiptImage(RECEIPT_LOGO_SRC);
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  const contentWidth = RECEIPT_IMAGE_WIDTH - RECEIPT_IMAGE_PADDING * 2;
  const commands = [];
  let y = RECEIPT_IMAGE_PADDING;

  const addText = (text, options = {}) => {
    const {
      font = "600 22px Courier New",
      lineHeight = 26,
      align = "left",
      marginBottom = 0,
      maxWidth = contentWidth,
    } = options;
    measureContext.font = font;
    const lines = wrapCanvasText(measureContext, text, maxWidth);
    commands.push({ type: "text", lines, font, lineHeight, align, y, maxWidth });
    y += lines.length * lineHeight + marginBottom;
  };

  const addPair = (left, right, options = {}) => {
    const {
      font = "600 22px Courier New",
      lineHeight = 26,
      marginBottom = 0,
      leftWidth = 240,
      rightWidth = contentWidth - 248,
    } = options;
    measureContext.font = font;
    const leftLines = Array.isArray(left)
      ? left
      : wrapCanvasText(measureContext, left, leftWidth);
    const rightLines = Array.isArray(right)
      ? right
      : wrapCanvasText(measureContext, right, rightWidth);
    const lineCount = Math.max(leftLines.length, rightLines.length);
    commands.push({
      type: "pair",
      leftLines,
      rightLines,
      font,
      lineHeight,
      y,
      leftWidth,
    });
    y += lineCount * lineHeight + marginBottom;
  };

  const addDivider = (marginY = 7) => {
    y += marginY;
    commands.push({ type: "divider", y });
    y += marginY;
  };

  if (logo) {
    const maxLogoWidth = 104;
    const maxLogoHeight = 58;
    const ratio = Math.min(
      maxLogoWidth / logo.width,
      maxLogoHeight / logo.height,
    );
    const width = logo.width * ratio;
    const height = logo.height * ratio;
    commands.push({ type: "image", image: logo, width, height, y });
    y += height + 10;
  }

  addText(RECEIPT_STORE_NAME, {
    font: "600 34px Courier New",
    lineHeight: 38,
    align: "center",
    marginBottom: 4,
    maxWidth: 372,
  });
  addText(RECEIPT_TAGLINE, {
    font: "600 19px Courier New",
    lineHeight: 23,
    align: "center",
    marginBottom: 4,
    maxWidth: 372,
  });
  RECEIPT_ADDRESS_LINES.forEach((line) =>
    addText(line, {
      font: "600 20px Courier New",
      lineHeight: 23,
      align: "center",
      maxWidth: 372,
    }),
  );
  addText(RECEIPT_CONTACT, {
    font: "600 20px Courier New",
    lineHeight: 23,
    align: "center",
    maxWidth: 372,
  });

  addDivider();
  addPair(
    ["Bill", receiptData.billNumber],
    [receiptData.tanggal, receiptData.jam],
    {
      font: "600 22px Courier New",
      lineHeight: 26,
      leftWidth: 128,
      rightWidth: 210,
    },
  );
  addDivider();
  addPair("Item x Qty", "Rate", {
    font: "600 23px Courier New",
    lineHeight: 27,
    marginBottom: 5,
    leftWidth: 230,
    rightWidth: 116,
  });

  receiptItems.forEach((item) => {
    addPair(item.nama_produk, formatReceiptAmount(item.total_harga), {
      font: "600 22px Courier New",
      lineHeight: 26,
      marginBottom: item.keterangan && item.keterangan !== "-" ? 0 : 3,
      leftWidth: 242,
      rightWidth: 120,
    });
    if (item.keterangan && item.keterangan !== "-") {
      addText(`(${item.keterangan})`, {
        font: "600 21px Courier New",
        lineHeight: 24,
        marginBottom: 1,
        maxWidth: 242,
      });
    }
    addPair(
      `${item.jumlah} x ${formatReceiptAmount(item.harga_satuan)}`,
      formatReceiptAmount(item.total_harga),
      {
        font: "600 21px Courier New",
        lineHeight: 25,
        marginBottom: 5,
        leftWidth: 236,
        rightWidth: 120,
      },
    );
  });

  addDivider();
  addPair("Total pesanan", formatReceiptAmount(receiptSubtotal), {
    font: "600 23px Courier New",
    lineHeight: 27,
    leftWidth: 232,
    rightWidth: 126,
  });
  addPair("Ongkir", formatReceiptAmount(receiptShipping), {
    font: "600 23px Courier New",
    lineHeight: 27,
    leftWidth: 232,
    rightWidth: 126,
  });
  addPair("Total bayar", formatReceiptAmount(receiptGrandTotal), {
    font: "600 23px Courier New",
    lineHeight: 27,
    leftWidth: 232,
    rightWidth: 126,
  });
  addDivider();
  addText("TERIMA KASIH", {
    font: "600 26px Courier New",
    lineHeight: 31,
    align: "center",
    marginBottom: 8,
  });

  const canvas = document.createElement("canvas");
  canvas.width = RECEIPT_IMAGE_WIDTH;
  canvas.height = Math.ceil(y + RECEIPT_IMAGE_PADDING);
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000000";
  context.strokeStyle = "#000000";
  context.lineWidth = 2;

  commands.forEach((command) => {
    if (command.type === "image") {
      context.drawImage(
        command.image,
        (RECEIPT_IMAGE_WIDTH - command.width) / 2,
        command.y,
        command.width,
        command.height,
      );
      return;
    }

    if (command.type === "divider") {
      context.save();
      context.setLineDash([5, 4]);
      context.beginPath();
      context.moveTo(RECEIPT_IMAGE_PADDING, command.y);
      context.lineTo(RECEIPT_IMAGE_WIDTH - RECEIPT_IMAGE_PADDING, command.y);
      context.stroke();
      context.restore();
      return;
    }

    context.font = command.font;
    context.fillStyle = "#000000";
    context.textBaseline = "top";

    if (command.type === "pair") {
      command.leftLines.forEach((line, index) => {
        context.textAlign = "left";
        context.fillText(
          line,
          RECEIPT_IMAGE_PADDING,
          command.y + index * command.lineHeight,
        );
      });
      command.rightLines.forEach((line, index) => {
        context.textAlign = "right";
        context.fillText(
          line,
          RECEIPT_IMAGE_WIDTH - RECEIPT_IMAGE_PADDING,
          command.y + index * command.lineHeight,
        );
      });
      return;
    }

    command.lines.forEach((line, index) => {
      context.textAlign = command.align;
      const x =
        command.align === "center"
          ? RECEIPT_IMAGE_WIDTH / 2
          : RECEIPT_IMAGE_PADDING;
      context.fillText(line, x, command.y + index * command.lineHeight);
    });
  });

  return canvas.toDataURL("image/png");
};
